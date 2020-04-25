import {getUUid, typeOf, addEventListener, removeEventListener} from '../util';

function canvasSupported () {
    return !!document.createElement('canvas').getContext;
}

function getBoundingClientRect(el) {
  return el.getBoundingClientRect ? el.getBoundingClientRect() : {
    left: 0,
    top: 0
  };
}

// 返回一个 dom相对于屏幕距离的对象
function defaultGetZrXY(el, e, out) {
  // This well-known method below does not support css transform.
  var box = getBoundingClientRect(el);
  out.zrX = e.clientX - box.left;
  out.zrY = e.clientY - box.top;
}

// 输出 鼠标点与某一个 dom的相对 x,y 距离
// from: https://github.com/ecomfe/zrender/tree/master/src/core/event.js
function clientToLocal(el, e, out, calculate) {
    out = out || {}; // According to the W3C Working Draft, offsetX and offsetY should be relative
    // to the padding edge of the target element. The only browser using this convention
    // is IE. Webkit uses the border edge, Opera uses the content edge, and FireFox does
    // not support the properties.
    // (see http://www.jacklmoore.com/notes/mouse-position/)
    // In zr painter.dom, padding edge equals to border edge.
    // FIXME
    // When mousemove event triggered on ec tooltip, target is not zr painter.dom, and
    // offsetX/Y is relative to e.target, where the calculation of zrX/Y via offsetX/Y
    // is too complex. So css-transfrom dont support in this case temporarily.
  
    if (calculate || canvasSupported()) {
      defaultGetZrXY(el, e, out);
    } // Caution: In FireFox, layerX/layerY Mouse position relative to the closest positioned
    // ancestor element, so we should make sure el is positioned (e.g., not position:static).
    // BTW1, Webkit don't return the same results as FF in non-simple cases (like add
    // zoom-factor, overflow / opacity layers, transforms ...)
    // BTW2, (ev.offsetY || ev.pageY - $(ev.target).offset().top) is not correct in preserve-3d.
    // <https://bugs.jquery.com/ticket/8523#comment:14>
    // BTW3, In ff, offsetX/offsetY is always 0.
    // else if (env.browser.firefox && e.layerX != null && e.layerX !== e.offsetX) {
        // out.zrX = e.layerX;
        // out.zrY = e.layerY;
    //   } // For IE6+, chrome, safari, opera. (When will ff support offsetX?)
      else if (e.offsetX != null) {
          out.zrX = e.offsetX;
          out.zrY = e.offsetY;
        } // For some other device, e.g., IOS safari.
        else {
            defaultGetZrXY(el, e, out);
          }
  
    return out;
}

// 为某个 dom, 输出一个规格化的事件对象：
// 该对象会在原本的 MouseEvent 对象基础上, 添加三个属性: zrX, zrY, zrDelta; 分别表示 MouseEvent对象相对于 dom的 x, y距离, MouseEvent对象 缩放的系数 
// from: https://github.com/ecomfe/zrender/tree/master/src/core/event.js
function normalizeEvent(el, e, calculate) {
    e = e || window.event;

    if (e.zrX != null) {
        return e;
    }
  
    var eventType = e.type;
    var isTouch = eventType && eventType.indexOf('touch') >= 0;
    

    if (!isTouch) {
        clientToLocal(el, e, e, calculate);
        e.zrDelta = e.wheelDelta ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
    } else {
        // var touch = eventType !== 'touchend' ? e.targetTouches[0] : e.changedTouches[0];
        // touch && clientToLocal(el, touch, e, calculate);
    }
  
    return e;
}

export {
    normalizeEvent,
    canvasSupported,
    defaultGetZrXY
}