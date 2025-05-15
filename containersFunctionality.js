import { removeFirstPercent, displayTree } from './script.js';

window.level = 1;
document.getElementById("visualButton").addEventListener("click", () => {
    window.level++;
    displayTree(window.level);
    window.tree = document.getElementById('visualization').innerHTML;
    MathJax.typeset();
});

document.getElementById("sizeButton").addEventListener("click", () => {
    window.sizeLatex = removeFirstPercent(window.sizeLatex);
    document.getElementById('size').innerHTML = window.sizeLatex;
    MathJax.typeset();
});

document.getElementById("conButton").addEventListener("click", () => {
    window.conLatex = removeFirstPercent(window.conLatex);
    document.getElementById('constants').innerHTML = window.conLatex;
    MathJax.typeset();
});

document.getElementById("evalButton").addEventListener("click", () => {
    window.evalLatex = removeFirstPercent(window.evalLatex);
    document.getElementById('evaluate').innerHTML = window.evalLatex;
    MathJax.typeset();
});

document.getElementById("depthButton").addEventListener("click", () => {
    window.depthLatex = removeFirstPercent(window.depthLatex);
    document.getElementById('depth').innerHTML = window.depthLatex;
    MathJax.typeset();

});


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
