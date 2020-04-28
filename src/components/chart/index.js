import {pointToDom, returnFalse, getDevicePixelRatio} from '../../lib/util/index';

class Chart {
    constructor (selector, {
        mode,
        width,
        height,
        leftPadding,
        topPadding,
        rightPadding,
        bottomPadding,
        tooltip,
        dpr
    }) {
        let char = 'abcdefghijklmnopqrstuvwxyz';
        this.domID = char[(Math.random() * char.length) | 0] + Math.floor(Math.random() * 7303 * 2401);
        this.selector = selector;
        this.boxDom = document.querySelector(selector);
        this.width = width || this.boxDom.clientWidth;
        this.height = height || this.boxDom.clientHeight;
        this.context = null;
        this.data = null;
        this.tipsBox = null;
        this.tooltip = Object.assign({show: true, trigger: 'item'}, tooltip || {});   // 目前只实现了 trigger的绑定
        this.leftPadding = leftPadding || 60;
        this.bottomPadding = bottomPadding || 60;
        this.rightPadding = rightPadding || 30;
        this.topPadding = topPadding || 30;

        this.mode = mode || '2d';
        this.dpr = dpr || getDevicePixelRatio();
        this.lastFrameAlpha = 0.7;

        this.lastWindowWidth = document.documentElement.clientWidth;
        this.lastWindowHeight = document.documentElement.clientHeight;

        // this.eventManager = {};
        this.requestManager = {};
        this.timerManager = [];
    }
    
    init() {
        let _this = this;
        let box = this.boxDom;

        box.innerHTML = '';
        this.initToolTipBox();

        let canvas = document.createElement('canvas');
        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;
        canvas.id = this.domID;


        var domStyle = canvas.style;
        if (domStyle) {
            domStyle.onselectstart = returnFalse; // 避免页面选中的尴尬
            domStyle['-webkit-user-select'] = 'none';
            domStyle['user-select'] = 'none';
            domStyle['-webkit-touch-callout'] = 'none';
            domStyle['-webkit-tap-highlight-color'] = 'rgba(0,0,0,0)';
            domStyle['padding'] = 0;
            domStyle['margin'] = 0;
            domStyle['border-width'] = 0;
        }

        this.canvas = canvas;
        this.context = canvas.getContext(this.mode);

        // this.canvas.onmousemove = function (e) {
        //     let pointToCanvas = pointToDom(e.clientX, e.clientY, _this.selector);
        //     let windowWidth = _this.width;

        //     e.preventDefault(); // prevent selections

        //     if (_this.showTooltip) {
        //         if (windowWidth - pointToCanvas.x > windowWidth / 2) {
        //             _this.tipsBox.style.left = pointToCanvas.x + "px";
        //         } else {
        //             _this.tipsBox.style.left = (pointToCanvas.x - _this.tipsBox.clientWidth) + "px";
        //         }
        //         _this.tipsBox.style.top = pointToCanvas.y + 10 + 'px';
        //     }
        // }

        this.boxDom.appendChild(canvas);
    }

    initToolTipBox () {
        if (this.tooltip.show) {
            
            let tooltip = document.createElement('div');
            let tooltipDefultStyle = {
                'display': 'none',
                '-webkit-user-select': 'none',
                'user-select': 'none',
                '-webkit-touch-callout': 'none',
                '-webkit-tap-highlight-color': 'rgba(0,0,0,0)',
                'border-width': '0',
                'margin': '0',
                'padding': '5px',
                'background': 'rgba(0,0,0,0.5)',
                'position': 'absolute',
                'transform': 'translate(0px, 0px)',
                'fontSize': '12px',
                'lineHeight': '1.6',
                'color': '#fff',
                'textAlign': 'left',
                'wordBreak': 'break-all',
                'borderRadius': '3px',
                'boxShadow': 'rgba(0, 0, 0, 0.2) 0px 1px 4px',
                // 'transition': 'transform 0.3s cubic-bezier(0.68, 0, 0, 0.97) 0s',
            }
            tooltip.className = "tooltip-box";

            if (tooltip.style) {
                var domStyle = tooltip.style;
                // domStyle.cssText = 'position;absolute'
                for (var key in tooltipDefultStyle) {
                    domStyle[key] = tooltipDefultStyle[key]
                };

                // 先设定默认的样式, 如果有自定义的样式, 那么再去设置
                var safeAttr = ['padding', 'background', 'fontSize', 'lineHeight', 'boxShadow', 'color', 'borderRadius', 'textAlign'];
                if (this.tooltip.style) {
                    safeAttr.forEach(key => {
                        if (this.tooltip.style[key] !== undefined) {
                            domStyle[key] = this.tooltip.style[key]
                        }
                    })
                };
            }
            

            this.boxDom.style.position = "relative";
            this.boxDom.appendChild(tooltip);
            this.tipsBox = tooltip;
        }
    }

    hideTips () {
        if (this.tipsBox) {
            this.tipsBox.style.display = 'none';
        }
    }

    setTipsContent (text, x, y) {
        this.tipsBox.style.display = "block";
        let html = `<div class='scatter-table'>${text == undefined ? '' : text}</div>`;
        this.tipsBox.innerHTML = html;
        this.tipsBox.display = 'block';

        var tipWidth = this.tipsBox.getBoundingClientRect().width;
        var chartWidth = this.width;
        var oldPos = this.tipsBox.getAttribute('transform');

        // var match = /[-?\d.]+/g;
        // var ty;
        // if (ty = val.match(match)) {
        //     this.tipsBox.style.transform = `translate(${x}px, ${y}px)`;
        // }

        if (this.width - x < tipWidth + 30) {
            this.tipsBox.style.transform = `translate(${x - tipWidth - 10}px, ${y +10}px)`;
        } else {
            this.tipsBox.style.transform = `translate(${x + 10}px, ${y + 10}px)`;
        }   
    }

    relayout (width, height) {
        if (width || height) {
            this.width = width * this.dpr;
            this.height = height * this.dpr;
        } else {
            var newWinWidth = document.documentElement.clientWidth;
            var newWinHeight = document.documentElement.clientHeight;

            if (this.lastWindowWidth !== newWinWidth || this.lastWindowHeight !== newWinHeight) {
                this.width = (this.width + (newWinWidth - this.lastWindowWidth)) * this.dpr;
                this.height = (this.height + (newWinHeight - this.lastWindowHeight)) * this.dpr;  

                this.lastWindowWidth = newWinWidth * this.dpr;
                this.lastWindowHeight = newWinHeight * this.dpr;
            }
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    destory () {
        // 
        for (var reqKey in this.requestManager) {
            if(Array.isArray(this.requestManager[reqKey])){
                this.requestManager[reqKey].map(request => {
                    typeof request.abort === 'function' && request.abort();
                    typeof request.cancel === 'function' && request.cancel();
                })
            } else {
                typeof this.requestManager[reqKey].abort === 'function' && this.requestManager[reqKey].abort();
                typeof this.requestManager[reqKey].cancel === 'function' && this.requestManager[reqKey].cancel();
            }
        }
        // 
        this.timerManager.map(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
            cancelAnimationFrame(timerId);
        })
        // 
        this.boxDom.innerHTML = '';

        for (var key in this) {
            delete this[key];
        }
    }

    errorHandler () {}
}

export default Chart;

export {
    Chart
}