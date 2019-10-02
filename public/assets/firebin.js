$(document).ready(function(){
    var textArea = document.getElementById('editor');
    var editor = CodeMirror.fromTextArea(textArea, {
        lineNumbers:true,
        lineWrapping: true,
        scrollbarStyle:"overlay"
    });
});