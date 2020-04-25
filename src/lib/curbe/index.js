// 参考: zRender 
function sub (out, p1, p2) {
    out.x = p1.x - p2.x;
    out.y = p1.y - p2.y;
}
function scale (out, obj, k) {
    out.x = obj.x*k;
    out.y = obj.y*k;
}

function distance (v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}

function add (out, p1, p2) {
    out.x = p1.x + p2.x;
    out.y = p1.y + p2.y;
    return out
}
/**
 * 贝塞尔平滑曲线
 * copy from :zrender/src/graphic/helper/smoothBezier, 
 * 控制点计算方法 https://wenku.baidu.com/view/c790f8d46bec0975f565e211.html
 * @param {Array} points 线段顶点数组
 * @param {number} smooth 平滑等级, 0-1
 * @param {Array} 计算出来的控制点数组
 */
function getCtrlPoint(ps, smooth, isLoop){
    smooth = smooth || 0.5;
    
    var cps = [];
    var v = {}, v1 = {}, v2 = {}, prevPoint, nextPoint;
    
    for (var i = 0, len = ps.length; i < len; i++) {

        if (isLoop) {
            prevPoint = points[i ? i - 1 : len - 1];
            nextPoint = points[(i + 1) % len];
        }
        else {
            if (i === 0 || i === len - 1) {
                cps.push({...ps[i]});
                continue;
            } else {
                prevPoint = ps[i - 1];
                nextPoint = ps[i + 1];
            }
        }
        
        sub(v, nextPoint, prevPoint);
        scale(v, v, smooth);
        
        var d0 = distance(ps[i], prevPoint);
        var d1 = distance(ps[i], nextPoint);
        var sum = d0 + d1;
        
        if (sum !== 0) {
            d0 /= sum;
            d1 /= sum;
        }
        
        scale(v1, v, -d0);
        scale(v2, v, d1);
        
        var cp0 = add({}, ps[i], v1);
        var cp1 = add({}, ps[i], v2);
        
        cps.push(cp0);
        cps.push(cp1);
    }

    if (isLoop) {
        cps.push(cps.shift());
    }
    return cps;
}

export {
    getCtrlPoint,
    sub,
    add,
    distance,
    scale
}