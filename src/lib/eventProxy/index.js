import {getUUid, addEventListener, removeEventListener} from '../util/index';
import {normalizeEvent} from './zrEvent';

/**
 * 支持 DOM事件, 自定义事件, 制定的一个事件代理函数; 
 * 思路: 对于一个 canvas 元素而言, 事件代理主要围绕 坐标体系/路径/点 之类来为不同位置 注册不同的事件类型;
 *       因此在实现上, 考虑了两种添加事件方式:
 *          1. 如果声明了坐标区域, 那么仅仅在坐标区域才 触发坐标区域内的监听函数队列: 这种只支持 MouseEvent事件类型, 不支持 keyboardEvent 类型事件:
 *          2. 如果没有声明坐标区域, 那么当同类型事件发生时, 则直接触发同类型的不包含声明区域的函数队列
 * 
 *       这个事件对象必须包含的基本功能有:  
 *          1. 注册事件: 为某一个(坐标位置|形状), 注册不同类型事件
 *                  (坐标位置|形状): { type: 'shape|block', data: {参数}, area: [[x0, y0], [x1, y1]] } area 表示注册事件的区域, 
 *                      注意为 area区域注册事件会因为 存在多图层覆盖的情况, 也即 注册事件所在图层被其他图层覆盖, 也会触发注册事件, 这可能并不是我们所希望看到的 
 *                      
 *                      处理方式目前支持两种:
 *                          1. 设置函数的 silence属性;    
 *                                  有时事件不应该被注销, 但也不应该被触发, 所以增加了一个额外的 silence属性来控制
 *                                  只有当 silence为 false时, 才会触发事件; 这里简化了实现, 直接为注册事件挂载一个 silence属性即可:
 *                          2. 为注册事件增加权重 zIndex(默认为 0), 并为事件返回 true, 即可停止事件派发
 *                                  权重较高的, 会被放置在队列前面, 派发事件时从前往后, 如果其中有一个事件返回结构判断为 true, 则会停止事件派发;
 * 
 *                  类型事件: MouseEvent, keyboardEvent 中选择部分来实现, 出于浏览器兼容性考虑, 部分事件需要特殊处理
 * 
 *          2. 解绑事件: 清空某一个类型中的某个事件; 清空所有同类型的事件回调; 清空注册区块的所有事件回调等
 *          3. 派发事件: 判断鼠标所在位置, 判断是否在形状中/坐标位置内; 然后找出位置中所有注册的回调函数/对象的, 然后调用:
 *                          并在调用时传入 query, 传入 该事件对象, 传入当前 dom 等必要信息
 *       
 *       这个事件对象也应该具备基本的属性:
 *          1. isSilence 
 *          2. uid 自动分配的一个事件 id, 这个可能在
 *          3. e 事件对象的扩展, 对于 canvas元素而言, 鼠标相对于 canvas 的 x, y坐标经常会被用到, 所以往事件对象中添加了 zrX, zrY, zrDelta三个属性:
 * 
 */
class EventProxy {

    constructor (selector) {
        // detect available wheel event
        var support = "onwheel" in document.createElement("div") ? "wheel" : // 各个厂商的高版本浏览器都支持"wheel"
            document.onmousewheel !== undefined ? "mousewheel" : // Webkit 和 IE一定支持"mousewheel"
            "DOMMouseScroll"; // 低版本firefox

        // 支持的所有类型事件;
        var hanlderNamesAlias = {
            mouseenter: 'mouseover',
            mouseleave: 'mouseout',
            contextmenu: 'contextmenu',
            click: 'click',
            dblclick: 'dblclick',
            mousewheel: support == 'DOMMouseScroll' ? 'MozMousePixelScroll' : support,
            mousedown: 'mousedown',
            mouseup: 'mouseup',
            mousemove: 'mousemove',
            brush: 'mousedown',     // 对于 brush事件, 尚未实现;
            setPointStyle: 'mousemove'
        }

        this.dom = document.querySelector(selector);
        this.eventHandlerNames = hanlderNamesAlias;
        this.eventHandler = {};
        this.eventDispatcher = {};
        this.registerBlock = [];
    }
    
    createFunc (aliasName) {
        var _this = this;
        return function (e) {
            normalizeEvent(_this.dom, e);
            _this.dispatchEventToElement(e, _this.dom, aliasName);
        }
    }

    // 添加事件: 可能是 DOM类型事件, 也可能是自定义事件;
    // {@param.eventAliasName} 事件别名: 必要参数
    // {@param.data} 要传递的参数: 必要参数
    // {@param.cb} 要执行的回调: 可选参数
    // {@param.context} 回调函数要执行的上下文对象: 可选参数
    addEvent (eventAliasName, data, cb, context) {
        var domRawEvent;
        var method = 'push';
        var args = [].slice.call(arguments, 1);

        // 如果除事件类型外, 只有一个参数, 那么判断哪一个参数是否为函数;
        if (args.length === 1) {
            cb = typeof args[0] === 'function' ? args[0] : undefined;
            data = undefined;
            context = undefined;
        }
        // 如果是两个参数, 可能是 data + cb, 也可能是 cb + context 的组合 
        // 如果第一个参数是函数, 那么认为传入的是 回调 + 上下文的组合
        // 如果第二个参数是函数, 那么认为传入的是 数据 + 回调的组合
        else if (args.length === 2) {
            if (typeof args[0] === 'function') {
                cb = args[0];
                context = args[1];
                data = null;
            } else if (typeof args[1] === 'function') {
                data = args[0];
                cb = args[1];
                context = null;
            }
        } else if (args.length === 3) {
            data = args[0];
            cb = typeof args[1] === 'function' ? args[1] : undefined;
            context = args[2];
        }

        if (!cb) {
            return;
        }
        cb.uid = cb.uid || getUUid();

        // 如果是绑定的 DOM事件, 给 DOM添加同类型事件
        if (domRawEvent = this.eventHandlerNames[eventAliasName]) {

            if (!this.eventDispatcher[eventAliasName]) {
                this.eventDispatcher[eventAliasName] = this.createFunc(eventAliasName);
                addEventListener(this.dom, domRawEvent, this.eventDispatcher[eventAliasName]);
            }
        }
        // 注册 dom类型事件的处理
        if (this.eventHandler[eventAliasName]) {
            // 默认阻止一个事件的重复挂载 ; 原则上不应该阻止, 应该遵守调用者的一切行为;
            if (this.eventHandler[eventAliasName].findIndex(ev => { return ev.uid === cb.uid }) === -1) {
                this.eventHandler[eventAliasName][method]({
                    uid: cb.uid,
                    data: data,
                    silence: !!cb.silence,
                    callback: cb,
                    zIndex: cb.zIndex || 0,
                    block: data && data.block || cb.block,
                    context: context
                });
            } else if (cb.$repeat) {
                this.eventHandler[eventAliasName][method]({
                    uid: cb.uid,
                    data: data,
                    silence: !!cb.silence,
                    callback: cb,
                    zIndex: cb.zIndex || 0,
                    block: data && data.block || cb.block,
                    context: context
                });
            }
        }
        // 注册自定义类型事件的处理 
        else {
            // 注册事件时, 传入的一个规格化的事件描述对象;
            //  uid 事件函数的唯一 id
            //  data 事件执行时, 暂存的参数值: 可能是一个原始值(primitive value), 也可能是一个引用
            //  silence 事件函数是否执行的控制条件
            //  callback 要执行的函数
            //  zIndex 事件的权重
            //  block 事件注册的位置: 这个值目前实现的是 {x1, y1, x2, y2};
            this.eventHandler[eventAliasName] = [{
                uid: cb.uid,
                data: data,
                silence: !!cb.silence,
                callback: cb,
                zIndex: cb.zIndex || 0,
                block: data && data.block || cb.block,
                context: context
            }];
        }
    }

    // 往 回调队列中, 删除某一个事件对象
    // {@param.eventAliasName } 要删除的事件类型别名
    // {@param.block } 要删除某一个声明块内注册的事件
    // {@param.cb } 要删除的事件
    removeEvent (eventAliasName, block, cb) {
        var uid,
            cur,
            condition;
        
        if (!cb && block) { 
            cb = block;
            block = null;
        };

        uid = cb.uid;
        if (!uid) {
            // console.warn('未注册的回调或不是一个有效的回调, 无法清除');
            return
        }

        if (this.eventHandler[eventAliasName]) {

            for (var i = 0; i < this.eventHandler[eventAliasName].length; i++) {
                cur = this.eventHandler[eventAliasName][i];
                condition = block ? this.isBlockContainBlock(block, cur.block) && cur.uid === uid : cur.uid === uid;

                if (condition) {
                    this.eventHandler[eventAliasName].splice(i, 1);
                }
            }
        }
    }

    // 分发 DOM事件:
    dispatchEventToElement (event, dom, eventAliasName) {
        var listen = this.eventHandler[eventAliasName];
        var length = listen && listen.length;
        var tobreak = false,
            curFunc,
            inBlockListen,
            stop,
            stopImmediatePropagation,
            locationToDom;
        if (length) {
            listen.sort((fn1, fn2) => {
                return fn1.zIndex > fn2.zIndex ? -1 : 1
            });

            locationToDom = {x: event.zrX, y: event.zrY};
            // 为 click类型事件特殊处理, 如果注册的函数声明了 block区块, 那么筛选出当前区块内的事件队列: 建议注册点击事件时都为函数增加 block属性以控制点击范围, 点击区块变化时, 更新函数的 block属性即可;
            // 如果没有 block属性, 也同样分发出去, 要控制只执行一次, 为某个函数添加一个较高的 zIndex, 且函数返回值为 true, 则停止事件派发
            inBlockListen = listen.filter(fn => {
                if (fn.block) {
                    // if (eventAliasName !== 'click') {
                    //     return true
                    // } else {
                        return this.isPointInBlock(fn.block, locationToDom);
                    // }
                } else {
                    return true
                }
            });
            length = inBlockListen.length;
            for (var i = 0; i < length; i++) {
                curFunc = inBlockListen[i];
                if (!curFunc.silence && typeof curFunc.callback === 'function') {
                    stop = curFunc.callback.call(curFunc.context, event, dom, curFunc.data);
                    if (stop) {
                        if (typeof stop === 'object') {
                            tobreak = !!stop.stopPropagation;
                            stopImmediatePropagation = !!stop.stopImmediatePropagation;
                        } else {
                            tobreak = true
                        }
                    } else {
                        tobreak = false;
                    }
                }
                if (tobreak) {
                    break
                }
            }
            // 鼠标右键时, 如果要阻止浏览器右键默认行为, 那么应该在 contextmenu的回调中返回一个有效值;
            if (stopImmediatePropagation) {
                if (eventAliasName === 'contextmenu') {
                    document.oncontextmenu = stopImmediatePropagation ? function (e) {
                        e.stopImmediatePropagation();
                        return false
                    } : null;
                } else {
                    document.oncontextmenu = null;
                    event.stopImmediatePropagation();
                }
            } else {
                document.oncontextmenu = null;
            }
        }
    }

    // 为某一个块内注册样式修改的事件;
    // {@param eventDetail.id} 当前块注册的唯一 id, 如果图形有更新, 根据这个 id匹配更新块信息即可
    // {@param eventDetail.style} 要设置的鼠标样式
    // {@param eventDetail.block: {x1, y1, x2, y2}}
    // {@param eventDetail.zIndex} 当前块的权重值
    registerEventStyleInBlockModel (eventDetail) {        
        var triggerEventName = 'setPointStyle';
        var domRawEvent = 'mousemove';

        // 如果还没有同类型的函数被注册, 那么初始化;
        if (!this.eventDispatcher[triggerEventName]) {
            this.eventDispatcher[triggerEventName] = this.eventMoveToSetPointStyleHandler.bind(this);
            addEventListener(this.dom, domRawEvent, this.eventDispatcher[triggerEventName]);
        }

        if (this.registerBlock.findIndex(block => { return block.id === eventDetail.id }) === -1) {
            this.registerBlock.push(eventDetail);
        } else {
            // 已经存在相同的函数, 无需重复注册
        }
    }

    // 更新函数注册块;
    updateRegisterBlock (id, param) {
        this.registerBlock.forEach(item => {
            if (item.id === id) {
                for (var key in param) {
                    if (key !== 'id') {
                        item[key] = param[key];
                    }
                }
            }
        })
    };

    // 删除某个块样式修改的事件
    removeRegisterBlock (id) {
        // var index = this.registerBlock.findIndex(block => {
        //     return block.id === id;
        // });
        // if (index !== -1) {
        //     this.registerBlock.splice(index, 1);
        // }
        for (var i = 0; i < this.registerBlock.length; i++) {
            if (this.registerBlock[i].id === id) {
                this.registerBlock.splice(i, 1);
            }
        }
    };

    // 鼠标移动时, 设置鼠标样式的统一处理:
    eventMoveToSetPointStyleHandler (e) {
        var {left, top} = this.dom.getBoundingClientRect ? this.dom.getBoundingClientRect() : {left: 0, top: 0};
        var registerBlock = this.registerBlock;
        // normalizeEvent(this.dom, e);
        var locationToDom = {x: e.clientX - left, y: e.clientY - top};

        var areas = registerBlock.filter(block => {
            return this.isPointInBlock(block.block, locationToDom);
        });
        if (!areas || areas.length === 0) {
            this.setPointStyle(this.dom, 'default');
            return
        }

        // 找出最大权重块
        var maxLevel = 0;
        var maxLevelIndex = 0;
        areas.forEach((block,index) => {
            maxLevelIndex = maxLevel <= block.zIndex ? index : maxLevelIndex;
            maxLevel = maxLevel <= block.zIndex ? block.zIndex : maxLevel;
        });

        this.setPointStyle(this.dom, areas[maxLevelIndex].style);
    }

    setPointStyle (dom, style) {
        if (dom.style) {
            dom.style.cursor = style || 'default'
        }
    }

    // 判断点是否在某一个矩形方块内:
    // block: x1, x2, y1, y2; point: x, y;
    isPointInBlock (block, point) {
        return block.x1 <= point.x && block.x2 >= point.x && block.y1 <= point.y && block.y2 >= point.y;
    }

    // 判断一个块是否全包含另一个块
    // {@param pBlock} Object{x1, y1, x2, y2}
    // {@param sBlock} Object{x1, y1, x2, y2} 
    isBlockContainBlock (pBlock, sBlock) {
        return pBlock.x1 <= sBlock.x1 && pBlock.x2 >= sBlock.x2 && pBlock.y1 <= sBlock.y1 && pBlock.y2 >= sBlock.y2;
    }

    // 分发自定义事件: 
    dispatchEvent (eventType, params) {
        var isDomEvent = this.eventHandlerNames[eventType];
        var params = [].slice.call(arguments, 1);
        if (isDomEvent) {
            // 
        } else {
            var listen = this.eventHandler[eventType];
            var length = listen && listen.length;
            var tobreak = true,
                curFunc;
            if (length) {
                listen.sort((fn1, fn2) => {
                    return fn1.zIndex > fn2.zIndex ? -1 : 1
                });
                for (var i = 0; i < length; i++) {
                    curFunc = this.eventHandler[eventType][i];
                    if (!curFunc.silence && typeof curFunc.callback === 'function') {
                        tobreak = tobreak & !curFunc.callback.apply(curFunc.context, [curFunc.data].concat(params));
                    }
                    if (!tobreak) {
                        break
                    }
                }
            }
        }
    }

    // 清楚所有注册事件;
    disposeAll (eventAliasName) {
        var eventHandlerNames = this.eventHandlerNames;
        // 没传递类型, 则删除所有事件回调
        if (!eventAliasName) {
            Object.keys(eventHandlerNames).forEach(aliasName => {
                var evName = eventHandlerNames[aliasName];
                removeEventListener(this.dom, evName, this.eventDispatcher[aliasName]);
            });

            Object.keys(this.eventHandler).forEach(aliasName => {
                this.eventHandler[aliasName].length = 0;
            });

            document.oncontextmenu = null;
        } 
        // 如果传了事件类型, 只清除监听函数队列
        else {
            if (this.eventHandler[eventAliasName]) {
                this.eventHandler[eventAliasName].length = 0;
            }
        }
    }
}

export default EventProxy;

export {
    EventProxy,

}