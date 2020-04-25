import {Point} from './point';

/**
 * This code is from the book
 * Core HTML5 Canvas published by Prentice-Hall in 2012.
 */
var Polygon = function (centerX, centerY, radius, sides, startAngle, strokeStyle, fillStyle, filled) {
    this.x = centerX;
    this.y = centerY;
    this.radius = radius;
    this.sides = sides;
    this.startAngle = startAngle;
    this.strokeStyle = strokeStyle;
    this.fillStyle = fillStyle;
    this.filled = filled;
};

/**
 * 绘制多边形方法: 给定一个中心点, 半径, 旋转角度, 边数; 计算出多边形每一个点的坐标点, 然后依次链接两个点;
 */
Polygon.prototype = {
    getPoints: function () {
        var points = [],
            angle = this.startAngle || 0;

        for (var i=0; i < this.sides; i++) {
            points.push(new Point(this.x + this.radius * Math.sin(angle), this.y - this.radius * Math.cos(angle)));
            angle += 2*Math.PI/this.sides;
        }
        
        return points;
    },

    createPath: function (context, doNotIntercept) {
        var points = this.getPoints();
        if(!doNotIntercept) {
            context.beginPath();
        }

        if (points.length) {
            context.moveTo(points[0].x, points[0].y);
            for (var i=1; i<this.sides; i++) {
                context.lineTo(points[i].x, points[i].y);
            }
        }   
        

        if (!doNotIntercept) {
            context.closePath();
        }
    },

    stroke: function (context) {
        context.save();
        this.createPath(context);
        context.strokeStyle = this.strokeStyle;
        context.stroke();
        context.restore();
    },

    fill: function (context) {
        context.save();
        this.createPath(context);
        context.fillStyle = this.fillStyle;
        context.fill();
        context.restore();
    },

    move: function (x, y) {
        this.x = x;
        this.y = y;
    }
}

export default Polygon;

export {
    Polygon,
    Point
}
