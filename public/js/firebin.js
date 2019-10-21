// Vue.component('modal', {
//     template: '#login-template'
// });


var editor; // reference to editor app
var app; // reference to vue app
var code = ""; // string formatted paste
var raw = false; // is the url requesting a raw code page?
var reading; // null else document id?
var InitialOwner = null;
var InitialTitle;
var InitialSyntax = 'default';
var InitialTheme = 'default';
var userHistory;
var Styles = [
    { name: "Default", syntax: "default" },
    // CUSTOM SYNTAX
    { name: "ActionScript", syntax: "actionscript" },
    { name: "C++", syntax: "c_cpp" },
    { name: "C#", syntax: "csharp" },
    { name: "Css", syntax: "css" },
    { name: "Html", syntax: "html" },
    { name: "JavaScript", syntax: "javascript" },
    { name: "Json", syntax: "json" },
    { name: "Svg", syntax: "svg" },
    { name: "Text", syntax: "text" },
    { name: "TypeScript", syntax: "typescript" },
    { name: "Xml", syntax: "xml" },
    { name: "Yaml", syntax: "yaml" },
];
var Themes = [
    {
        name: "Default",
        group: [
            { name: "Default", theme: "default" }
        ]
    },
    {
        name: "Light themes",
        group: [
            { name: "Chrome", theme: "chrome" },
            { name: "Crimson", theme: "crimson_editor" },
            { name: "Dawn", theme: "dawn" },
            { name: "Eclipse", theme: "eclipse" },
            { name: "GitHub", theme: "github" },
            { name: "Solarized", theme: "solarized_light" },
            { name: "SQL Server", theme: "sqlserver" },
        ]
    },
    {
        name: "Dark themes",
        group: [
            { name: "Ambiance", theme: "ambiance" },
            { name: "Dracula", theme: "dracula" },
            { name: "Green", theme: "gob" },
            { name: "Merbivore", theme: "merbivore" },
            { name: "Solarized", theme: "solarized_dark" },
            { name: "Terminal", theme: "terminal" },
        ]
    }
];

$(document).ready(async function () {
    // const firebase = require("firebase");
    // require("firebase/firestore");
    if (!firebase) return;

    if (window.location.pathname.length > 1) {
        if (window.location.pathname.endsWith("/raw")) {
            raw = true;
            document.getElementById("cache").value = await FetchDocument(window.location.pathname);
            return;
        }
        else {
            code = await FetchDocument(window.location.pathname);
            // document.getElementById("title").value = InitialTitle;
        }
    }

    const db = firebase.firestore();

    app = new Vue({
        el: '#main',
        data: {
            emptyPaste: true,
            username: null,
            submit: 'Submit',
            login: 'Sign in',
            showLogin: false,
            showProfile: false,
            isOwner: false,
            OwnerID: InitialOwner,
            selectedSyntax: InitialSyntax,
            selectedTheme: InitialTheme,
            history: [],
            themes: Themes,
            styles: Styles,
        },
        methods: {
            async submitpaste() {
                const collectionRef = db.collection('bin');
                const NewTitle = (document.getElementById("title").value.length > 0) ? document.getElementById("title").value : "Untitled";
                const paste = {
                    code: editor.getValue(),
                    owner: firebase.auth().currentUser.uid,
                    syntax: document.getElementById("syntax").value,
                    title: NewTitle
                };

                if (!reading) {
                    await collectionRef.add(paste)
                        .then(ref => {
                            const newUrl = [window.location.protocol, "", window.location.hostname, ref.id].join("/");
                            window.location = newUrl;
                            this.ownerID = firebase.auth().currentUser.uid;

                            window.location.assign(newUrl);
                            navigator.permissions.query({ name: "clipboard-write" }).then(result => {
                                if (result.state == "granted" || result.state == "prompt") {
                                    navigator.clipboard.writeText(newUrl);
                                }
                            });
                            alert("Copied: " + newUrl);
                        })
                        .catch(e => alert(e.message));
                }
                else {
                    await collectionRef.doc(reading).update(paste)
                        .then(() => {
                            const newUrl = [window.location.protocol, "", window.location.hostname, reading].join("/");
                            window.location = newUrl;

                            this.ownerID = firebase.auth().currentUser.uid;

                            window.location.assign(newUrl);
                            navigator.permissions.query({ name: "clipboard-write" }).then(result => {
                                if (result.state == "granted" || result.state == "prompt") {
                                    navigator.clipboard.writeText(newUrl);
                                }
                            });
                            // alert("Copied: " + newUrl);
                        })
                        .catch(e => {
                            console.log(e.message);
                            return;
                        });

                }
                // return;
            },
            updateOwner() {
                if (!firebase.auth().currentUser)
                    this.isOwner = false;
                if (this.OwnerID == firebase.auth().currentUser.uid)
                    this.isOwner = true;
                else this.isOwner = false;
            },
            updateHistory() {
                this.history = userHistory;
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
                }
                else {
                    this.login = "Sign in";
                    this.username = 'Unauthorised';
                }
                app.updateOwner();
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
                if (firebase.auth().currentUser && firebase.auth().currentUser.isAnonymous)
                    this.showLogin = true;
                else {
                    firebase.auth().signOut();
                }
            },
            updateTheme() {
                this.selectedTheme = document.getElementById("theme").value;
                refreshEditorStyle();
            },
            updateSyntax() {
                this.selectedSyntax = document.getElementById("syntax").value;
                refreshEditorStyle();
            },
            toggleProfile() {
                this.showProfile = !this.showProfile;
            },
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
            var docRef = db.collection("profile").doc(firebase.auth().currentUser.uid);

            docRef.get().then(function (doc) {
                if (doc.exists) {
                    document.getElementById("theme").value = doc.get("theme");
                    app.updateTheme();
                    var _history = doc.data().history || [];
                    userHistory = [];
                    for (let index = 0; index < _history.length; index++) {
                        const split = _history[index].split("/", 1);
                        userHistory.push({ name: _history[index].substr(split[0].length + 1), uid: split[0] });
                    }
                    app.updateHistory();
                    // console.log("Document data:", doc.data());
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }).catch(function (error) {
                console.log("Error getting document:", error);
            });

            history = "";
            app.authstatechange(user);
        } else {
            firebase.auth().signInAnonymously().catch(function (error) {
                alert(error.message);
                app.updateOwner();
            });
        }
    });





    editor = ace.edit(document.getElementById("aceEditor"));
    refreshEditorStyle();

    editor.setFontSize("13px");
    editor.renderer.setScrollMargin(10, 10);
    editor.session.setValue(code);
    
    if(InitialTitle)
    document.getElementById("title").value = InitialTitle;


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
    // if (window.location.pathname.length > 0) {
    //     if (window.location.pathname.endsWith("/raw"))
    //         raw = true;
    //     var path = window.location.pathname.replace("/raw", "");
    //     var url = "https://firestore.googleapis.com/v1beta1/" +
    //         "projects/firebin-1/databases/(default)/documents/bin" + path;
    //     fetch(url)
    //         .then(response => response.json())
    //         .then(paste => {
    //             if (paste.error) { }
    //             // document.getElementById("cache").textContent = paste.error.code + ": "+ paste.error.message;
    //             else {
    //                 // document.getElementById("cache").textContent = paste.fields.code.stringValue.replace(/\n/g, '<br>\n');
    //                 code = paste.fields.code.stringValue; //.value = // JSON.stringify()
    //                 if (raw)
    //                     document.getElementById("cache").value = code;//"TESTING RAW PAST\nNew Line!";
    //                 else
    //                     editor.session.setValue(code);
    //                 // https://github.com/ajaxorg/ace/issues/1886
    //             }
    //         });
    // }


});

async function refreshEditorStyle() {


    // SET THEME FROM USER DATA
    if (!app.selectedTheme || app.selectedTheme == "default" || app.selectedTheme == "")
        editor.setTheme("ace/theme/gruvbox");
    else
        editor.setTheme("ace/theme/" + app.selectedTheme);

    // SET THEME FROM PASTE DATA
    if (!app.selectedSyntax || app.selectedSyntax == "default" || app.selectedSyntax == "")
        editor.session.setMode("ace/mode/markdown");
    else
        editor.session.setMode("ace/mode/" + app.selectedSyntax);

}

async function FetchDocument(id) {
    var doc = id.replace("/raw", "");
    var url = "https://firestore.googleapis.com/v1beta1/" +
        "projects/firebin-1/databases/(default)/documents/bin" + doc;
    var final = await fetch(url)
        .then(response => response.json())
        .then(paste => {
            if (paste.error) {
                alert("404: Invalid or Expired ID");
                return "";
            }
            else {
                
                InitialTitle = paste.fields.title.stringValue ||  "Untitled";
                InitialOwner = paste.fields.owner.stringValue || "";
                InitialSyntax = paste.fields.syntax.stringValue || "default";
                return paste.fields.code.stringValue;
            }
        })
        .catch(e => {
            alert("Catch: " + e.message);
            InitialOwner = "";
            return "";
        });
    reading = doc;

    return final;

}