// monaco-editor-setup.js

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

window.editor; // Declare the editor variable globally

require(['vs/editor/editor.main'], function () {
    // Register language and syntax highlighting
    monaco.languages.register({ id: 'myCustomLang' });

    monaco.languages.setMonarchTokensProvider('myCustomLang', {
        tokenizer: {
            root: [
                // Kľúčové slová
                [/\b(if|then|else|pred|succ|iszero)\b/, 'keyword'],
        
                // Literály (nesmie nasledovať nič ďalšie)
                [/\b(true|false|0)\b(?!\s*\w|\s*\()/, 'constant'],
        
                // Zátvorky
                [/[()]/, 'delimiter'],
        
                // Medzery
                [/\s+/, 'white']
            ]
        }
        
    });

    monaco.languages.setLanguageConfiguration('myCustomLang', {
        brackets: [['(', ')']],
        autoClosingPairs: [{ open: '(', close: ')' }]
    });

    // Initialize Monaco editor
    window.editor = monaco.editor.create(document.getElementById("editor_container"), {
        language: "myCustomLang",
        theme: "vs",  // You can also use "vs-dark" or other themes
        fontSize: 20,
        lineHeight: 26,
        fontFamily: '"Fira Code", monospace',
        renderLineHighlight: 'line',
        renderWhitespace: 'all',
        lineNumbers: "on",
        width: '100%',
        wordWrap: 'on',  // Enable word wrapping
        wrappingIndent: 'same'
    });

    // Set initial values
    let currentFontSize = 20;
    let currentLineHeight = 26;

    // Event listener for "+" button (increase font size and line height)
    document.getElementById('increaseFontSizeAndLineHeight').addEventListener('click', function () {
        currentFontSize += 2;
        currentLineHeight += 2;  // Increase both font size and line height
        window.editor.updateOptions({ fontSize: currentFontSize, lineHeight: currentLineHeight });
    });

    // Event listener for "-" button (decrease font size and line height)
    document.getElementById('decreaseFontSizeAndLineHeight').addEventListener('click', function () {
        if (currentFontSize > 10 && currentLineHeight > 16) {  // Minimum limits for font size and line height
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