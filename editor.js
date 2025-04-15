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

export function zoom() {
    let zoomableContainers = document.querySelectorAll("#size, #constants, #evaluate, #depth, #visualization");

    zoomableContainers.forEach(container => {
        let scale = 1; // Uchovanie mierky

        container.addEventListener("wheel", function (event) {
            event.preventDefault();
            let zoomIntensity = 0.1; // Citlivosť zoomu

            if (event.deltaY < 0) {
                scale += zoomIntensity;
            } else {
                scale -= zoomIntensity;
                if (scale < 0.1) scale = 0.1; // Minimálny zoom
            }

            // Aplikovanie zoomu na deti kontajnera
            Array.from(container.children).forEach(child => {
                child.style.transform = `scale(${scale})`;
                child.style.transformOrigin = "center center";
            });
        });
    });
}


export function full_screen () {
    const fullscreenButtons = document.querySelectorAll(".fullscreen-button");

    fullscreenButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const container = event.target.closest(".parent-container, .parent-container2, .size-container, .constants-container, .evaluate-container, .depth-container, .results-container");
            toggleFullscreen(container);
        });
    });

    function toggleFullscreen(element) {
        if (!document.fullscreenElement) {
            // Save the current styles to restore them later
            const originalStyles = {
                width: element.style.width,
                height: element.style.height,
                margin: element.style.margin,
                position: element.style.position,
                top: element.style.top,
                left: element.style.left,
            };

            // Store original styles in a data attribute for later restoration
            element.dataset.originalStyles = JSON.stringify(originalStyles);

            // Request fullscreen
            element.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    document.addEventListener('fullscreenchange', () => {
        const container = document.fullscreenElement;

        if (container) {
            // When entering fullscreen, set styles for the container
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.margin = '0'; // Remove margins
            container.style.position = 'fixed'; // Make it fixed on the screen
            container.style.top = '0';
            container.style.left = '0';
        } else {
            // When exiting fullscreen, restore the original styles
            const fullscreenElement = document.querySelector('[data-original-styles]');
            if (fullscreenElement) {
                const originalStyles = JSON.parse(fullscreenElement.dataset.originalStyles);

                // Restore the original styles
                fullscreenElement.style.width = originalStyles.width;
                fullscreenElement.style.height = originalStyles.height;
                fullscreenElement.style.margin = originalStyles.margin;
                fullscreenElement.style.position = originalStyles.position;
                fullscreenElement.style.top = originalStyles.top;
                fullscreenElement.style.left = originalStyles.left;

                // Clear the data attribute after restoring the styles
                fullscreenElement.removeAttribute('data-original-styles');
            }
        }
    });
}