// Vue.component('modal', {
//     template: '#login-template'
// });


var editor; // reference to editor app
var app; // reference to vue app
var code; // string formatted paste
var raw; // is the url requesting a raw code page?
var reading; // is this an existing document?
var pasteUID;

$(document).ready(function () {
    // const firebase = require("firebase");
    // require("firebase/firestore");
    if (!firebase) return;

    if (window.location.pathname.endsWith("/raw")) {
        raw = true;
    }
    else {
        raw = false;
    }

    const db = firebase.firestore();

    app = new Vue({
        el: '#main',
        data: {
            emptyPaste: true,
            username: 'Guest',
            canEdit: true,
            submit: 'Submit',
            login: 'Sign in',
            showLogin: false
        },
        methods: {
            async submitpaste() {
                const collectionRef = db.collection('bin');
                const paste = {
                    code: editor.getValue(),
                    owner: firebase.auth().currentUser.uid,
                    syntax: ""
                };
                await collectionRef.add(paste)
                    .then(ref => {
                        const newUrl = window.location.protocol + window.location.domain + ref.id;
                        window.location = newUrl;

                        navigator.permissions.query({ name: "clipboard-write" }).then(result => {
                            if (result.state == "granted" || result.state == "prompt") {
                                navigator.clipboard.writeText(newUrl);
                                alert("Copied the url: " + newUrl);
                                window.location.assign(newUrl);
                            }
                        });
                    })
                    .catch(e => alert(e.message));
                // return;
            },
            authstatechange(user) {
                if (user) {
                    this.showLogin = false;
                    this.login = "Sign out";
                    if (user.isAnonymous) {
                        this.username = 'Guest';
                        this.login = "Sign in";
                    }
                    else if (user.providerData[0].displayName)
                        this.username = user.providerData[0].displayName;
                    else if (user.providerData[0].email)
                        this.username = user.providerData[0].email;
                    else
                        this.username = "Unidentified User";
                    console.log(user.providerData);
                }
                else {
                    this.login = "Sign in";
                    this.username = 'Unauthorised';
                }
            },
            SignInWithGoogle() {
                var user = firebase.auth().currentUser;
                var provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithPopup(provider).then(() => {
                    if (user.isAnonymous)
                        user.delete();
                });
            },
            SignInWithTwitter() {
                var user = firebase.auth().currentUser;
                var provider = new firebase.auth.TwitterAuthProvider();
                firebase.auth().signInWithPopup(provider).then(() => {
                    if (user.isAnonymous)
                        user.delete();
                });
            },
            SignInWithFacebook() {
                var user = firebase.auth().currentUser;
                var provider = new firebase.auth.FacebookAuthProvider();
                firebase.auth().signInWithPopup(provider).then(() => {
                    if (user.isAnonymous)
                        user.delete();
                });
            },
            SignInWithGitHub() {
                var user = firebase.auth().currentUser;
                var provider = new firebase.auth.GithubAuthProvider();
                firebase.auth().signInWithPopup(provider).then(() => {
                    if (user.isAnonymous)
                        user.delete();
                });
            },
            SignInWithMicrosoft() {
                var user = firebase.auth().currentUser;
                var provider = new firebase.auth.OAuthProvider('microsoft.com');
                firebase.auth().signInWithPopup(provider).then(() => {
                    if (user.isAnonymous)
                        user.delete();
                });
            },

            SignInOrOut() {
                if (firebase.auth().currentUser.isAnonymous)
                    this.showLogin = true;
                else
                    firebase.auth().signOut();
            }
        }
    });
    // firebase.auth().onAuthStateChanged(function(user) {
    //     if (user) {
    //       // User is signed in.
    //     } else {
    //       // No user is signed in.
    //     }
    //   });

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            app.authstatechange(user);
        } else {
            firebase.auth().signInAnonymously().catch(function (error) {
                alert(error.message);
            });
        }
    });




    editor = ace.edit(document.getElementById("aceEditor"));
    editor.setTheme("ace/theme/gruvbox");
    editor.session.setMode("ace/mode/text");
    editor.setFontSize("13px");
    editor.renderer.setScrollMargin(10, 10);

    editor.setOptions({
        // editor options
        selectionStyle: 'text',// "line"|"text"
        highlightActiveLine: true, // boolean
        highlightSelectedWord: true, // boolean
        readOnly: false, // boolean: true if read only
        cursorStyle: 'ace', // "ace"|"slim"|"smooth"|"wide"
        mergeUndoDeltas: false, // false|true|"always"
        behavioursEnabled: true, // boolean: true if enable custom behaviours
        wrapBehavioursEnabled: true, // boolean
        autoScrollEditorIntoView: undefined, // boolean: this is needed if editor is inside scrollable page
        keyboardHandler: null, // function: handle custom keyboard events

        // renderer options
        animatedScroll: false, // boolean: true if scroll should be animated
        displayIndentGuides: true, // boolean: true if the indent should be shown. See 'showInvisibles'
        showInvisibles: true, // boolean -> displayIndentGuides: true if show the invisible tabs/spaces in indents
        showPrintMargin: false, // boolean: true if show the vertical print margin
        printMarginColumn: 80, // number: number of columns for vertical print margin
        printMargin: false, // boolean | number: showPrintMargin | printMarginColumn
        showGutter: true, // boolean: true if show line gutter
        fadeFoldWidgets: false, // boolean: true if the fold lines should be faded
        showFoldWidgets: true, // boolean: true if the fold lines should be shown ?
        showLineNumbers: true,
        highlightGutterLine: false, // boolean: true if the gutter line should be highlighted
        hScrollBarAlwaysVisible: false, // boolean: true if the horizontal scroll bar should be shown regardless
        vScrollBarAlwaysVisible: false, // boolean: true if the vertical scroll bar should be shown regardless
        fontFamily: undefined, // string: set the font-family css value
        maxLines: undefined, // number: set the maximum lines possible. This will make the editor height changes
        minLines: undefined, // number: set the minimum lines possible. This will make the editor height changes
        maxPixelHeight: 0, // number -> maxLines: set the maximum height in pixel, when 'maxLines' is defined. 
        scrollPastEnd: 0, // number -> !maxLines: if positive, user can scroll pass the last line and go n * editorHeight more distance 
        fixedWidthGutter: false, // boolean: true if the gutter should be fixed width
        // theme: 'ace/theme/monokai', // theme string from ace/theme or custom?

        // mouseHandler options
        scrollSpeed: 2, // number: the scroll speed index
        dragDelay: 0, // number: the drag delay before drag starts. it's 150ms for mac by default 
        dragEnabled: true, // boolean: enable dragging
        focusTimeout: 0, // number: the focus delay before focus starts.
        tooltipFollowsMouse: true, // boolean: true if the gutter tooltip should follow mouse

        // session options
        firstLineNumber: 1, // number: the line number in first line
        overwrite: false, // boolean
        newLineMode: 'auto', // "auto" | "unix" | "windows"
        useWorker: true, // boolean: true if use web worker for loading scripts
        useSoftTabs: true, // boolean: true if we want to use spaces than tabs
        tabSize: 4, // number
        wrap: true, // boolean | string | number: true/'free' means wrap instead of horizontal scroll, false/'off' means horizontal scroll instead of wrap, and number means number of column before wrap. -1 means wrap at print margin
        indentedSoftWrap: true, // boolean
        foldStyle: 'markbegin', // enum: 'manual'/'markbegin'/'markbeginend'.
        // mode: 'ace/mode/text' // string: path to language mode 
    });

    // https://stackoverflow.com/questions/26037443/ace-editor-load-new-content-dynamically-clear-old-content-with-new-one
    // PRELOAD PASTE FOR TEXT AREA
    if (window.location.pathname.length > 1) {
        var path = window.location.pathname.replace("/raw", "");
        var url = "https://firestore.googleapis.com/v1beta1/" +
            "projects/firebin-1/databases/(default)/documents/bin" + path;
        fetch(url)
            .then(response => response.json())
            .then(paste => {
                if (paste.error) { }
                // document.getElementById("cache").textContent = paste.error.code + ": "+ paste.error.message;
                else {
                    // document.getElementById("cache").textContent = paste.fields.code.stringValue.replace(/\n/g, '<br>\n');
                    code = paste.fields.code.stringValue; //.value = // JSON.stringify()
                    document.getElementById("cache").value = code;
                    editor.session.setValue(code);
                    // https://github.com/ajaxorg/ace/issues/1886
                }
            });
    }


    //   editor.session.setValue(document.getElementById("cache").value);
    // if(window.location.pathname.endsWith("/raw")){
    //     document.getElementById("cache").hidden = false;
    //     document.getElementById("main").hidden = true;
    //     var cm = $('.CodeMirror')[0].CodeMirror;
    //     $(cm.getWrapperElement()).hide();
    // }
    // else{
    //     // https://codemirror.net/doc/manual.html#usage
    //     document.getElementById("editor").value = document.getElementById("cache").textContent;
    //     document.getElementById("cache").hidden = true;
    // }
});
