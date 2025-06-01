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

            const newLeft = ((leftWidth + dx) / containerWidth) * 100;
            const newRight = ((rightWidth - dx) / containerWidth) * 100;

            if (newLeft < 5 || newRight < 5) return; 

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

setupHorizontalResizers(document.getElementById('topRow'));
