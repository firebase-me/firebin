import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// const express = require('express');
// const cors = require('cors')({ origin: true });

// const app = express();
// // Automatically allow cross-origin requests
// app.use(cors({ origin: true }));

// import { FirebaseApp } from '@firebase/app-types';
// import { FirebaseAuth } from '@firebase/auth-types';
// import { FirebaseDatabase } from '@firebase/database-types';
// import { FirebaseMessaging } from '@firebase/messaging-types';
// import { FirebaseStorage } from '@firebase/storage-types';
// import { FirebaseFirestore } from '@firebase/firestore-types';

// el.host        // www.somedomain.com (includes port if there is one[1])
// el.hostname    // www.somedomain.com
// el.hash        // #top
// el.href        // http://www.somedomain.com/account/search?filter=a#top
// el.pathname    // /account/search
// el.port        // (port if there is one[1])
// el.protocol    // http:
// el.search      // ?filter=a

admin.initializeApp();
const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

// https://firebase.google.com/docs/functions/schedule-functions#write_a_scheduled_function
// https://cloud.google.com/appengine/docs/standard/python/config/cronref#custom
// https://medium.com/google-developer-experts/automatically-delete-your-firebase-storage-files-from-firestore-with-cloud-functions-for-firebase-36542c39ba0d
// https://www.reddit.com/r/Firebase/comments/85pm3r/firestore_security_how_do_i_use_document_wildcard/
exports.scheduledCleanup = functions.pubsub.schedule('every day 00:00').onRun(async (context) => {
  const batchSize = 100;
  let collectionRef = await db.collection('bin').where('created', "<", new Date().getDate() - 30);
  let query = collectionRef.orderBy('created').limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  })
  .catch(e => console.log(e));
});

exports.bakeDocument = functions.firestore.document('bin/{docId}').onCreate((event, context) => {
  const doc = admin.firestore().collection('bin').doc(String(context.params.docId));
  doc.update({ created: Date.now() })
  .catch(e => console.log(e));;
  doc.get()
    .then(data => {
      const owner = data.get("owner");
      const title = data.get("title");
      const reference = data.id;
      const meta = { "history": admin.firestore.FieldValue.arrayUnion(reference + "/" + title) };
      if (owner)
        admin.firestore().collection('profile').doc(owner).update(meta)
          .catch(e => console.log(e));
    })
    .catch(e => console.log(e));
});

// On Document Delete, remove document from owner history
exports.purgeDocument = functions.firestore.document('bin/{docId}')
  .onDelete(DataSnapshot => {
    const owner = DataSnapshot.get("owner");
    const title = DataSnapshot.get("title");
    if (owner) {
      const meta = { "history": admin.firestore.FieldValue.arrayRemove(DataSnapshot.id + "/" + title) };
      admin.firestore().collection('profile').doc(owner).update(meta)
        .catch(e => console.log(e));;
    };
  });

// exports.paste = functions.https.onCall((data, context) => {
//   // is this call valid?
//   if (context.auth == null || data.paste == null || data.doc == null)
//     return;

//   admin.auth().verifyIdToken(context.auth.uid)
//     .then((decodedToken: admin.auth.DecodedIdToken) => {
//       let uid = decodedToken.uid;

//       // https://firebase.google.com/docs/rules/rules-and-auth
//       if (data.doc == null)
//         db.collection('bin').add({
//           code: "code",
//           created: Date.now(),
//           owner: uid
//         })
//           .catch(err => console.log(err));
//       else {
//         db.collection('bin').doc(data.doc).update({ code: data.paste })
//           .catch(err => console.log(err));
//       }

//     }).catch(function (error: any) {
//       console.log(error)// Handle error
//     });
//if(context.auth.token

// https://firebase.google.com/docs/firestore/manage-data/add-data#add_a_document
//   db.collection('cities').add(document)
//     .then(ref => {
//       console.log('Added document with ID: ', ref.id);
//     });
// else
//   
// });
// https://www.youtube.com/watch?v=Z87OZtIYC_0
// https://firebase.google.com/docs/reference/rest/database

// exports.getPaste = functions.https.onRequest((req, res) => {
//   cors(req, res, () => {
//     if (req.method !== "POST") {
//       return res.status(500).json({ message: 'Please send valid POST request' });
//     }
//     if (req.query.bin == null) {
//       return res.status(500).json({ message: 'Missing valid Query key' });
//     }

//     db.collection('bin').doc(req.query.bin).get()
//       .then(snapshot => {
//         if (snapshot.exists) {
//           const data = snapshot.data();
//           res.status(200).send(data);
//         }
//         else
//           res.status(404).json({ message: "No such document." });
//       })
//       .catch(e => {
//         res.status(500).json({ error: e });
//       });
//     return;
//   })
// });

function deleteQueryBatch(firestore: FirebaseFirestore.Firestore, query: FirebaseFirestore.Query, batchSize: number, resolve: { (value?: unknown): void; (): void; }, reject: (reason?: any) => void) {
  query.get()
    .then((snapshot) => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0;
      }

      // Delete documents in a batch
      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        const owner = doc.get("owner");
        if (owner) {
          const meta = { "history": admin.firestore.FieldValue.arrayRemove(doc.ref) };
          admin.firestore().collection('profile').doc(owner).update(meta)
            .catch(e => console.log(e));
        }
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    }).then((numDeleted) => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(firestore, query, batchSize, resolve, reject);
      });
    })
    .catch(reject);
}