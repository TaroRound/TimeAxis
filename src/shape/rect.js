// 绘制带圆角的矩形: 以 cornerX, cornerY 为 x,y; 输出一个 宽度为 width, 高度为 height, 圆角大小为 cornerRadius 的圆角矩形路径
function roundedRect(canvas2dContext, cornerX, cornerY, width, height, cornerRadius) {
    if (width > 0) {
       canvas2dContext.moveTo(cornerX + cornerRadius, cornerY)
    } else {
       canvas2dContext.moveTo(cornerX - cornerRadius, cornerY);
    };

    canvas2dContext.arcTo(cornerX + width, cornerY,
                  cornerX + width, cornerY + height,
                  cornerRadius);
    canvas2dContext.arcTo(cornerX + width, cornerY + height,
                  cornerX, cornerY + height,
                  cornerRadius);
    canvas2dContext.arcTo(cornerX, cornerY + height,
                  cornerX, cornerY,
                  cornerRadius);
    if (width > 0) {
       canvas2dContext.arcTo(cornerX, cornerY,
                     cornerX + cornerRadius, cornerY,
                     cornerRadius);
    }
    else {
       canvas2dContext.arcTo(cornerX, cornerY,
                     cornerX - cornerRadius, cornerY,
                     cornerRadius);
    }
}

// 绘制一个支持渐变, 支持圆角的矩形: 仅支持 canvas.2d 绘图对象
// {param.x, param.y} 矩形左上角顶点的坐标 
// {param background}: 可以是一个颜色值, 也可以是一段渐变描述(简化: 这里仅支持单一渐变), 如: to right: 0% #000: 50% #ccc: 100% #fff;
// {param borderRadius}: 圆角, 类似于 border-radius 圆角;
function fillRect (canvas2dContext, x, y, width, height, background, border, borderRadius, boxShadow, isSave) {
    if (isSave) {
        canvas2dContext.save();
    }
    canvas2dContext.beginPath();
    var gradient = null;
    // 渐变
    if (background && background.indexOf(':') !== -1) {
        var gradientText = background.split(':'),
            colors = [],
            direction = null;

        try {
            gradientText.forEach((t,index) => {
                var tx = '';
                if (index === 0) {
                    direction = t.split(' ')[1].trim();
                } else {
                    tx = t.trim();
                    var start = tx.match(/^[0-9.%]+/)[0];
                    var color = tx.slice(start.length);

                    start = start[start.length - 1] === '%' ? parseFloat(start)/100 : +start;
                    colors.push({
                        rate: start,
                        color: color.trim()
                    });
                }
            });
        } catch (e) { console.warn('绘制矩形错误 ', e) };

        switch (direction) {
            case 'top':
                gradient = canvas2dContext.createLinearGradient(x, y + height, x, y);
                break;
            case 'bottom':
                gradient = canvas2dContext.createLinearGradient(x, y, x, y + height);
                break;
            case 'left':
                gradient = canvas2dContext.createLinearGradient(x + width, y, x, y);
                break;
            case 'right':
                gradient = canvas2dContext.createLinearGradient(x, y, x + width, y);
                break;
            case 'topLeft':
                gradient = canvas2dContext.createLinearGradient(x + width, y + height, x, y);
                break;
            case 'topRight':
                gradient = canvas2dContext.createLinearGradient(x, y + height, x + width, y);
                break;
            case 'bottomLeft':
                gradient = canvas2dContext.createLinearGradient(x + width, x, y, y + height);
                break;
            case 'bottomRight':
                gradient = canvas2dContext.createLinearGradient(x, y, x + width, y + height);
                break;
            default:
                break;
        }

        if (direction && gradient) {
            colors.forEach(color => {
                gradient.addColorStop(+color.rate, color.color);
            });

            canvas2dContext.fillStyle = gradient;
        }
    }
    // 纯色 
    else {
        canvas2dContext.fillStyle = background || '#000';
    }

    // 圆角
    if (borderRadius) {
        roundedRect(canvas2dContext, x, y, width, height, borderRadius);
    } else {
        canvas2dContext.rect(x, y, width, height);
    }
    
    if (boxShadow) {
        boxShadow = boxShadow.split(':');
        canvas2dContext.shadowColor = boxShadow[0];
        canvas2dContext.shadowBlur = boxShadow[1] || 0;
        canvas2dContext.shadowOffsetX = boxShadow[2] || 0;
        canvas2dContext.shadowOffsetY = boxShadow[3] || 0;
    }
    // canvas2dContext.fillRect(x, y, width, height);
    canvas2dContext.fill();
    if (border && border.borderWidth) {
        canvas2dContext.strokeWidth = border.borderWidth;
        canvas2dContext.strokeStyle = border.color;
        canvas2dContext.stroke();
    }

    canvas2dContext.closePath();
    if (isSave) {
        canvas2dContext.restore();
    }
}

export default fillRect;

export {
    fillRect,
    roundedRect
}