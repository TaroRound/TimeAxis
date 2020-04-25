/**
 * This code is from the book
 * Core HTML5 Canvas published by Prentice-Hall in 2012.
 */

var Point = function (x, y) {
    this.x = x;
    this.y = y;
    this.points = [];
};

/**
 * 三角函数
 *    a
 *    |\
 *    | \ 
 *    |__\
 *   c     b
 * ∠ACB为直角。对∠BAC而言，对边（opposite）a=BC、斜边（hypotenuse）c=AB、邻边（adjacent）b=AC(斜边是指直角三角形中最长的那条边，也指不是构成直角的那条边。在勾股定理中，斜边称作“弦”)
 * 存在以下关系
 *  正弦函数(sin): 对边比斜边
 *  余弦函数(cos): 邻边比斜边
 *  正切函数(tan): 对边比邻边
 * 
 * 以上图 ∠CAB为例, 角度记为 deg
 *  sin(deg) = c-b / b-a; 无限趋于0 或 无限趋于1, 取反方向则 (0, -1), 所以它的值域为 (-1, 0) (0, 1)
 *  cos(deg) = c-a / b-a;
 *  tan(deg) = c-b / c-a;
 * 
 * (给定一个值, 求角度? 这个问题超出个人认知范围)
 * 
 * 弧度: 在数学和物理中，弧度是角的度量单位.定义：弧长等于半径的弧，其所对的圆心角为1弧度。(即两条射线从圆心向圆周射出，形成一个夹角和夹角正对的一段弧。当这段弧长正好等于圆的半径时，两条射线的夹角的弧度为1)。
 *      根据定义，一周的弧度数为2πr/r=2π, 360°角=2π弧度. 因此，1弧度约为57.3°, 1°为π/180弧度, 平角（即180°角）为π弧度，直角为π/2弧度。
 *      在具体计算中，角度以弧度给出时，通常不写弧度单位，直接写值。最典型的例子是三角函数，如sin
 *          例如: sin(90deg) => Math.sin( Math.PI / 2 ) => 1
 *      
 * 在 JS中, 内置 Math对象还提供了一个静态方法 asin([-1, 1]), 方法返回一个数值的反正弦（单位为弧度）, 值范围 [-π/2 到 π/2]
 *      例如: Math.asin(1) => 1.5707963267948966 === Math.PI / 2
 */
Point.prototype = {
    rotate: function (rotationPoint, angle) {
        var tx, ty, rx, ry;
    
        tx = this.x - rotationPoint.x; // tx = translated X
        ty = this.y - rotationPoint.y; // ty = translated Y
 
        rx = tx * Math.cos(-angle) - // rx = rotated X
             ty * Math.sin(-angle);
 
        ry = tx * Math.sin(-angle) + // ry = rotated Y
             ty * Math.cos(-angle);
 
        return new Point(rx + rotationPoint.x, ry + rotationPoint.y); 
    }
};

 
export default Point;

export {
    Point
}