import Point from './point';
import {Polygon} from './polygon';
import {getCtrlPoint} from '../lib/curbe/index';

// 绘制圆弧路径
function circle (canvas2dContext, ogriginX, ogriginY, radius, strokeStyle, fillStyle) {

    canvas2dContext.moveTo(ogriginX, ogriginY);
    canvas2dContext.arc(ogriginX, ogriginY, radius, 0, 2*Math.PI, false);
    canvas2dContext.strokeStyle = strokeStyle;
    canvas2dContext.fillStyle = fillStyle;
}

// 绘制带端点的线条; 对于时间轴而言, 起点是圆形, 终点是三角形;
// {param.from: {x, y}, param.to: {x, y}}
// {param.lineStyle: { lineWidth: Number, dash: Array, color: HSC }}
// {param.lineEnd: {start: {}, end: {}}} 线的两端增加的形状;
function fillLine (canvas2dContext, from, to, lineStyle, lineEnd, isSave) {
    lineStyle = lineStyle || {};

    isSave && canvas2dContext.save();
    canvas2dContext.beginPath();
    canvas2dContext.lineWidth = lineStyle.lineWidth || 1;
    canvas2dContext.strokeStyle = lineStyle.color || '#999';
    if (lineStyle.dash && Array.isArray(lineStyle.dash)) {
        canvas2dContext.setLineDash(lineStyle.dash);
    } else {
        canvas2dContext.setLineDash([]);
    }
    
    // 绘制带端点修饰的线条: 先画线, 再画起止点形状:
    if (lineEnd) {
        // 先画线
        canvas2dContext.lineWidth = lineStyle.lineWidth || 1;
        canvas2dContext.moveTo(from.x, from.y);
        canvas2dContext.lineTo(to.x, to.y);
        canvas2dContext.stroke();

        // 开始点
        if (lineEnd.start) {
            var polygon = null;
            
            canvas2dContext.moveTo(from.x, from.y);
            switch (lineEnd.start.shape) {
                case 'circle':
                    
                    circle(canvas2dContext, from.x, from.y, lineEnd.start.size, lineEnd.start.stroke, lineEnd.start.fill);
                    lineEnd.start.stroke && canvas2dContext.stroke();
                    lineEnd.start.fill && canvas2dContext.fill();
                    break;
                case 'polygon':
                    polygon = new Polygon(
                        from.x, 
                        from.y, 
                        lineEnd.start.size, 
                        lineEnd.start.shapeSides, 
                        lineEnd.start.transform,
                        lineEnd.start.stroke,
                        lineEnd.start.fill
                    );
                    polygon.createPath(canvas2dContext, true);
                    polygon.stroke(canvas2dContext);
                    polygon.fill(canvas2dContext);
                    lineEnd.start.fill && polygon.fill(canvas2dContext);
                    break;
                default:
                    break;
            }
        }

        if (lineEnd.end) {
            var polygon = null;

            switch (lineEnd.end.shape) {
                case 'circle':
                    circle(canvas2dContext, to.x, to.y, lineEnd.end.size, lineEnd.end.stroke, lineEnd.end.fill);
                    canvas2dContext.stroke();
                    canvas2dContext.fill();
                    break;
                case 'polygon':
                    polygon = new Polygon(
                        to.x, 
                        to.y, 
                        lineEnd.end.size, 
                        lineEnd.end.shapeSides, 
                        lineEnd.end.transform,
                        lineEnd.end.stroke,
                        lineEnd.end.fill
                    );
                    polygon.createPath(canvas2dContext, true);
                    polygon.stroke(canvas2dContext);
                    polygon.fill(canvas2dContext);
                    lineEnd.end.fill && polygon.fill(canvas2dContext);
                    break;
                default:
                    break;
            }

            canvas2dContext.moveTo(from.x, from.y);
        }

        // for (var i=0; i < points.length; i++) {
        //     canvas2dContext[i === 0 ? 'moveTo' : 'lineTo'](points.x, points.y);
        // }
        
        // lineStyle.fill && canvas2dContext.fill();
    } else {
        canvas2dContext.moveTo(from.x, from.y);
        canvas2dContext.lineTo(to.x, to.y);
        canvas2dContext.stroke();
        lineStyle.fill && canvas2dContext.fill();
    }

    canvas2dContext.closePath();
    isSave && canvas2dContext.restore();
}


/**
 * 创建一个绘制线条的实例对象
 * This code is from the book
 * Core HTML5 Canvas published by Prentice-Hall in 2012.
 */
function Line (p1, p2, strokeStyle, fillStyle) {
    this.p1 = p1;
    this.p2 = p2;
    this.points = [];
    p1 && this.points.push(p1);
    p2 && this.points.push(p2);
    this.fillStyle = fillStyle;
    this.strokeStyle = strokeStyle;
}

// 计算两条线的交叉点
Line.prototype.intersectionPoint = function (line) {
    var m1, m2, b1, b2, ip = new Point();
 
    if (this.p1.x === this.p2.x) {
        m2 = (line.p2.y - line.p1.y) / (line.p2.x - line.p1.x);
        b2 = line.p1.y - m2 * line.p1.x;
        ip.x = this.p1.x;
        ip.y = m2 * ip.x + b2;
    }
    else if(line.p1.x === line.p2.x) {
        m1 = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
        b1 = this.p1.y - m1 * this.p1.x;
        ip.x = line.p1.x;
        ip.y = m1 * ip.x + b1;
    }
    else {
        m1 = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x);
        m2 = (line.p2.y - line.p1.y) / (line.p2.x - line.p1.x);
        b1 = this.p1.y - m1 * this.p1.x;
        b2 = line.p1.y - m2 * line.p1.x;
        ip.x = (b2 - b1) / (m1 - m2);
        ip.y = m1 * ip.x + b1;
    }
    return ip;
};
// 往线条追加一个经过点
Line.prototype.addPoint = function (x, y) {
    this.points.push(new Point(x,y))
}
// 创建一个链接线条所有点的路径
Line.prototype.createPath = function (context) {
    if (this.points.length === 0)
       return;
       
    context.beginPath();
    context.moveTo(this.points[0].x,
                   this.points[0].y);
          
    for (var i=0; i < this.points.length; ++i) {
       context.lineTo(this.points[i].x,
                      this.points[i].y);
    }
 
    context.closePath();
};

Line.prototype.stroke = function (context) {
    context.save();
    this.createPath(context);
    context.strokeStyle = this.strokeStyle;
    context.stroke();
    context.restore();
}

Line.prototype.fill = function (context) {
    context.save();
    this.createPath(context);
    context.fillStyle = this.fillStyle;
    context.fill();
    context.restore();
}

// 创建一个贝塞尔平滑曲线路径
Line.prototype.createCurvePath = function (context, smooth) {
    var points = this.points;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    var points = this.points;
    var len = points.length;
    // 计算出
    var controlPoints = getCtrlPoint(points, smooth);

    for (var i = 0; i < len - 1; i++) {
        var cp1 = controlPoints[i * 2];
        var cp2 = controlPoints[i * 2 + 1];
        var p = points[(i + 1) % len];
        
        context.bezierCurveTo(
            cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y
        );
    }
    context.closePath();
}


export default fillLine;

export {
    fillLine,
    Line
}