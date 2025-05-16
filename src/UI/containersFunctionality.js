import { removeFirstPercent, displayTree } from '../lexer__parser/script.js';

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
        let scale = 1; 

        container.addEventListener("wheel", function (event) {
            event.preventDefault();
            let zoomIntensity = 0.1;
            if (event.deltaY < 0) {
                scale += zoomIntensity;
            } else {
                scale -= zoomIntensity;
                if (scale < 0.1) scale = 0.1;
            }

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

            const originalStyles = {
                width: element.style.width,
                height: element.style.height,
                margin: element.style.margin,
                position: element.style.position,
                top: element.style.top,
                left: element.style.left,
            };

            element.dataset.originalStyles = JSON.stringify(originalStyles);

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

            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.margin = '0'; 
            container.style.position = 'fixed'; 
            container.style.top = '0';
            container.style.left = '0';
        } else {

            const fullscreenElement = document.querySelector('[data-original-styles]');
            if (fullscreenElement) {
                const originalStyles = JSON.parse(fullscreenElement.dataset.originalStyles);


                fullscreenElement.style.width = originalStyles.width;
                fullscreenElement.style.height = originalStyles.height;
                fullscreenElement.style.margin = originalStyles.margin;
                fullscreenElement.style.position = originalStyles.position;
                fullscreenElement.style.top = originalStyles.top;
                fullscreenElement.style.left = originalStyles.left;

                fullscreenElement.removeAttribute('data-original-styles');
            }
        }
    });
}