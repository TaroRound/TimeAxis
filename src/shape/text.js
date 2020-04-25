// 暂未实现竖排文本, 暂未实现以路径排版文本;
// 
function fillText (canvas2dContext, x, y, text, textStyle, isSave) {
    textStyle = Object.assign({fontSize: 12}, textStyle || {});

    canvas2dContext.beginPath();
    canvas2dContext.font = textStyle.fontSize + "px serif";
    canvas2dContext.fillStyle = textStyle.color || '#666';
    canvas2dContext.textAlign = textStyle.align || 'center';
    canvas2dContext.textBaseline = textStyle.verticle || 'alphabetic';
    canvas2dContext.fillText(text, x, y);
    canvas2dContext.closePath();
}

export default fillText;

export {
    fillText
}