function setupHorizontalResizers(row) {
    const resizers = row.querySelectorAll('.resizer.vertical');
    resizers.forEach(resizer => {
        const left = resizer.previousElementSibling;
        const right = resizer.nextElementSibling;

        let startX = 0;
        let leftWidth = 0;
        let rightWidth = 0;

        const onMouseDown = (e) => {
            e.preventDefault();
            startX = e.clientX;
            leftWidth = left.getBoundingClientRect().width;
            rightWidth = right.getBoundingClientRect().width;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const containerWidth = row.getBoundingClientRect().width;

            // Calculate the new width as a percentage of the container
            const newLeft = ((leftWidth + dx) / containerWidth) * 100;
            const newRight = ((rightWidth - dx) / containerWidth) * 100;

            if (newLeft < 5 || newRight < 5) return; // Avoid going too small

            left.style.flex = `0 0 ${newLeft}%`;
            right.style.flex = `0 0 ${newRight}%`;

            if (window.editor) {
                editor.layout();
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (window.editor) {
                editor.layout();
            }
        };

        resizer.addEventListener('mousedown', onMouseDown);
    });
}



function setupVerticalResizer(resizer, topRow, bottomRow) {
    let startY = 0;
    let topHeight = 0;
    let bottomHeight = 0;
    let containerHeight = 0;
    

    const startTop = topRow.getBoundingClientRect().height;
    const startBottom = bottomRow.getBoundingClientRect().height;
    document.querySelector('#topRow').style.height = `${startTop}px`;
    document.querySelector('#bottomRow').style.height = `${startBottom}px`;
    const onMouseDown = (e) => {
        e.preventDefault();
        startY = e.clientY;
        topHeight = topRow.getBoundingClientRect().height;
        bottomHeight = bottomRow.getBoundingClientRect().height;
        containerHeight = topRow.parentNode.getBoundingClientRect().height; // Get container height
        
        // Attach mousemove and mouseup events to document
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

    };
    
    const onMouseMove = (e) => {
        const dy = e.clientY - startY; // Mouse movement in pixels
    
        // Calculate the new height in pixels
        const newTopHeight = topHeight + dy;
        const newBottomHeight = bottomHeight - dy;
    
        // Prevent the heights from becoming too small
        if (newTopHeight < 10 || newBottomHeight < 10) return;
    
        // Update the height in pixels (use 'height' instead of 'flex' to avoid percentage issues)
        document.querySelector('#topRow').style.height = `${newTopHeight}px`;
        document.querySelector('#bottomRow').style.height = `${newBottomHeight}px`;
        // If necessary, trigger a layout refresh for the editor (Monaco or similar)
        if (window.editor) {
            editor.layout();
        }
    };
    
    const onMouseUp = () => {
        // Remove the event listeners when mouse button is released
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    
    // Attach mousedown event to the resizer element
    resizer.addEventListener('mousedown', onMouseDown);
}



// Setup all resizers
setupHorizontalResizers(document.getElementById('topRow'));
setupHorizontalResizers(document.getElementById('bottomRow'));
setupVerticalResizer(
document.getElementById('middleResizer'),
document.getElementById('topRow'),
document.getElementById('bottomRow')
);