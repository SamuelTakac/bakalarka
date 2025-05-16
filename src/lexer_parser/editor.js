// monaco-editor-setup.js

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

window.editor; 

require(['vs/editor/editor.main'], function () {

    monaco.languages.register({ id: 'myCustomLang' });
    monaco.languages.setMonarchTokensProvider('myCustomLang', {
        tokenizer: {
            root: [

                [/\b(if|then|else|pred|succ|iszero)\b/, 'keyword'],
        
 
                [/\b(true|false|0)\b(?!\s*\w|\s*\()/, 'constant'],
        

                [/[()]/, 'delimiter'],
        
                [/\s+/, 'white']
            ]
        }
        
    });

    monaco.languages.setLanguageConfiguration('myCustomLang', {
        brackets: [['(', ')']],
        autoClosingPairs: [{ open: '(', close: ')' }]
    });


    window.editor = monaco.editor.create(document.getElementById("editor_container"), {
        language: "myCustomLang",
        theme: "vs",  
        fontSize: 20,
        lineHeight: 26,
        fontFamily: '"Fira Code", monospace',
        renderLineHighlight: 'line',
        renderWhitespace: 'all',
        lineNumbers: "on",
        width: '100%',
        wordWrap: 'on',  
        wrappingIndent: 'same'
    });


    let currentFontSize = 20;
    let currentLineHeight = 26;


    document.getElementById('increaseFontSizeAndLineHeight').addEventListener('click', function () {
        currentFontSize += 2;
        currentLineHeight += 2; 
        window.editor.updateOptions({ fontSize: currentFontSize, lineHeight: currentLineHeight });
    });


    document.getElementById('decreaseFontSizeAndLineHeight').addEventListener('click', function () {
        if (currentFontSize > 10 && currentLineHeight > 16) { 
            currentFontSize -= 2;
            currentLineHeight -= 2;
            window.editor.updateOptions({ fontSize: currentFontSize, lineHeight: currentLineHeight });
        }
    });
});

window.insertText = function(text){
    window.editor.setValue('');
    window.editor.setValue(text);
}
