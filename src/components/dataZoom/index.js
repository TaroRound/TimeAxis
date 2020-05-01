import {linear, pointToDom, formatDate, typeOf, merge_recursive, isInRange, calcBreakWord, getUUid, totalCountInAscArrByRange, getFirst, getExtremum, deepClone, getDate} from '../../lib/util/index';
import {fillRect} from '../../shape/rect';
import {fillLine, Line} from '../../shape/line';
import fillText from '../../shape/text';

/**
 * 数据缩放控件: 
 *  功能要点: 
 *      1. 支持对任意数值的缩放处理, 如 -100 ~ 100
 *      2. 支持拖动, 缩放, 在一个缩放范围之内的缩放(如一个极大范围, 极小范围), 点选;
 *      3. 暴露必要的 API, 提供给外部读取或设置组件状态;
 * 
 *      支持一些其他的扩展; 如数据视图 dataView, 本应该是以一个插件的形式扩展到该组件, 但这里简化了逻辑直接在 dataZoom 类中给实现了;
 * 
 *  API: 不再赘述;
 *
 * 另有个细节同样需要注意, 部分方法写的 fn = () => {} 这种形式, 这样写的方法会是属于实例上的一个方法 而不是原型中的方法, 这是有意为之的: 
 *  因为设计事件代理时, 是为每一个函数设置了属性 silence, uid 这些的, 如果把这些方法放到原型对象中, 就会导致多个实例时, 重复设置了同一个函数的值, 这会导致问题, 因此把这些方法放到了实例中;
 */
class dataZoom {
    constructor (canvas2dContext, {
        x,          // 滑块在 context的 x坐标
        y,          // 滑块在 context的 y坐标
        width,      // 滑块 x方向的最大边界;
        height,     // 滑块 y方向的最大边界
        leftPadding, // 滑块左边距
        rightPadding, // 滑块右边距
        direction,  // 滑块的方向 'vertical' : 'horizontal'
        start,      // 外滑块开始点
        end,        // 外滑块结束点(0-100)
        startValue, // 内滑块开始点
        endValue,   // 内滑块结束点
        dataViewData,   // 数据视图的值
        dataView,   // 数据视图
        selectStartPercent,
        selectEndPercent,
        safeValueRange, // 安全的值范围, 0-100 内的数值 
        min,        // 实际最小值
        max,        // 实际最大值
        resizeable, // 是否可以重新调整滑块的大小
        resizeToMinAble,    // 是否可以往小调整
        resizeToMaxAble,    // 是否可以往大调整
        sliderHeight,   // 滑块的高度: height定义边界, sliderHeight定义高度, 
        position,       // 滑块在给定边界内的位置, 一般来说, 边界与滑块大小一致;
        outer,          // 外滑块样式相关设置
        inner,          // 内滑块样式相关设置
        boundaryText,    // 滑块两端的文字设置
        resizerStyle    // 滑块两端重置大小的块 样式设置
    }, eventHandler, canvas) {
        this.uid = getUUid();
        this.x = x;
        this.y = y;
        this.canvas2dContext = canvas2dContext;
        this.sliderHeight = sliderHeight || 20;
        this.width = width || 0;
        this.height = height || 0;
        this.leftPadding = leftPadding || 0;
        this.rightPadding = rightPadding || 0;
        this.position = position || 'middle';
        this.direction = direction || 'horizontal';
        this.startValue = startValue || 0;
        this.endValue = endValue || 100;
        this.dataView = merge_recursive({show: true, stroke: null, fill: '#ccc'}, dataView || {});
        this.dataViewData = dataViewData;
        this.min = min || 0;
        this.max = max || 0;
        this.resizeable = resizeable == undefined ? true : !!resizeable;
        this.resizeToMaxAble = resizeToMaxAble == undefined ? true : !!resizeToMaxAble;
        this.resizeToMinAble = resizeToMinAble == undefined ? true : !!resizeToMinAble;
        this.safeValueRange = !this.resizeToMaxAble || !this.resizeable ? safeValueRange || this.endValue - this.startValue : 100;

        if (selectStartPercent !== undefined) {
            this.startValue = selectStartPercent;
        }
        if (selectEndPercent !== undefined) {
            this.endValue = selectEndPercent;
        }

        this.outer = merge_recursive({show: true, stroke: '#DDDDDD', background: 'rgba(0,0,0,0.0)' }, outer || {});
        this.inner = merge_recursive({show: true, background: 'rgba(97,104,112,0.5)', stroke: null}, inner || {});
        this.resizerStyle = merge_recursive({ color: '#838E9C', width: 6, position: 'center' }, resizerStyle || {});
        this.boundaryText = merge_recursive({ show: true, textStyle: {fontSize: 12} }, boundaryText || {});
        
        this.outer.show = this.outer.show == undefined ? true : this.outer.show;
        this.inner.show = this.inner.show == undefined ? true : this.inner.show;
        this.k = this.direction === 'horizontal' ? (this.width-this.leftPadding-this.rightPadding)/100 : (this.height-this.leftPadding-this.rightPadding)/100;
        this.linearScaleKWithValue = linear([0, 100], [this.min, this.max]);
        this.linearScaleValueWithWidth = null;

        // this.handlerIcon = 'M8.2,13.6V3.9H6.3v9.7H3.1v14.9h3.3v9.7h1.8v-9.7h3.3V13.6H8.2z M9.7,24.4H4.8v-1.4h4.9V24.4z M9.7,19.1H4.8v-1.4h4.9V19.1z';
        this.eventManager = eventHandler || {};
        this.eventRecord = [];
        this.shapes = {
            outer: {},
            inner: {},
            resizeRight: {},
            resizeLeft: {}
        };

        this.once = true;
        this.plugins = [];
        this.shapeBeingDragged = null;
        this.mousedown = {};
        this.lastdrag = {};
        this.lastSize = {};
        this.animation = {
            setPoint: null,
            renderShape_outer: null,
            renderShape_inner: null,
            renderShape_resize: null
        };

        this.plugins.forEach(plugin => {
            plugin.install(this);
        });
    }


    init () {
        this.createScale();
        this.drawSliders();

        this.initEventHandler();
        this.plugins.forEach(plugin => {
            plugin.init(this);
        });
    }

    createScale () {
        if (this.direction === 'horizontal') {
            this.linearScaleValueWithWidth = linear([this.min, this.max], [this.x + this.leftPadding, this.x + this.leftPadding + this.width - this.leftPadding - this.rightPadding]);  
        } else {
            this.linearScaleValueWithWidth = linear([this.min, this.max], [this.y + this.leftPadding, this.y + this.leftPadding + this.height - this.leftPadding - this.rightPadding]);
        }
    }

    // 设置滑块 鼠标样式;
    setPointStyleHandler (fromCache) {
        if (this.animation.setPoint) { cancelAnimationFrame(this.animation.setPoint) };
        // 因为滑块在移动过程中, 会被反复的重绘; 因此设置鼠标样式时, 加了一定的延迟;
        this.animation.setPoint = requestAnimationFrame(() => {
            var resizeStyle = this.direction === 'horizontal' ? 'e-resize' : 'n-resize';
            var moveStyle = 'move';
            var pointStyle = {
                outer: 'pointer',
                inner: moveStyle,
                resizeRight: resizeStyle,
                resizeLeft: resizeStyle
            }
            var zIndex = {
                outer: 1,
                inner: 2,
                resizeRight: 3,
                resizeLeft: 3
            }
            if (this.once) {
                for (var key in this.shapes) {
                    var {x, y, width, height} = this.shapes[key];
                    this.eventManager.registerEventStyleInBlockModel({
                        id: 'dataZoom-' + key + this.uid,
                        style: pointStyle[key],
                        block: {
                            x1: x,
                            y1: y,
                            x2: x + width,
                            y2: y + height
                        },
                        zIndex: zIndex[key]
                    });
                }
            } else {
                for (var key in this.shapes) {
                    var {x, y, width, height} = this.shapes[key];
                    this.eventManager.updateRegisterBlock('dataZoom-' + key + this.uid, {
                        block: {
                            x1: x,
                            y1: y,
                            x2: x + width,
                            y2: y + height
                        },
                        style: pointStyle[key]
                    });
                }
            }
            this.once = false;
        }, 16);
    }

    // 有个bug: 显示文本时, 擦除不去越界展示的文本;
    erase () {
        this.canvas2dContext.clearRect(this.x, this.y, this.width, this.height);
    }

    update (setting) {
        merge_recursive(this, setting);
        this.erase();

        var keys = Object.keys(setting);
        var isChangeRange = keys.includes('min') || keys.includes('max');
        var isChangeDataView = keys.includes('dataView') || keys.includes('dataViewData');
        if (isChangeRange) {
            this.createScale();
            this.k = this.direction === 'horizontal' ? (this.width-this.leftPadding-this.rightPadding)/100 : (this.height-this.leftPadding-this.rightPadding)/100;
            this.linearScaleKWithValue = linear([0, 100], [this.min, this.max]);
        }
        
        if (setting && setting.selectStartPercent !== undefined) {
            this.startValue = setting.selectStartPercent;
        }
        if (setting && setting.selectEndPercent !== undefined) {
            this.endValue = setting.selectEndPercent;
        }

        this.drawSliders(!(isChangeRange || isChangeDataView));
        // this.initEventHandler();

        this.plugins.forEach(plugin => {
            plugin.update(this);
        });
    }

    // 绘制整个滑块, 并且更新块鼠标样式, 更新移动,缩放等操作的块位置;
    drawSliders (fromCache) {
        var moveTo = {x: 0, y: 0},
            innerMoveTo = {x: 0, y: 0},
            resizer1 = {x: 0, y: 0},
            resizer2 = {x: 0, y: 0};
        var _x = this.x,
            _y = this.y,
            _direction = this.direction,
            _position = this.position,
            _leftPadding = this.leftPadding,
            _rightPadding = this.rightPadding,
            _sliderHeight = this.sliderHeight,
            _width = this.width,
            _height = this.height,
            _startValue = this.startValue,
            _endValue = this.endValue,
            _k = this.k,
            _resizerHeight;

        if (this.resizerStyle.height) {
            _resizerHeight = this.resizerStyle.height >= _sliderHeight ? _sliderHeight : this.resizerStyle.height;
        } else {
            _resizerHeight = _sliderHeight/2;
        } 
        // 计算滑块在给定边界中的位置; 分横向/纵向的情况
        if (_direction === 'horizontal') {

            switch (_position) {
                case 'top':
                    moveTo.x = _x + _leftPadding;
                    moveTo.y = _y;
                    break;
                case 'middle':
                    moveTo.x = _x + _leftPadding;
                    moveTo.y = _y + (_height - _sliderHeight)/2;
                    break;
                case 'bottom':
                    moveTo.x = _x + _leftPadding;
                    moveTo.y = _y + (_height - _sliderHeight);
                    break;
                default:
                    moveTo.x = _x + _leftPadding;
                    moveTo.y = _y + (_height - _sliderHeight);
                    break;
            }
            innerMoveTo.x = moveTo.x + _startValue*_k;
            innerMoveTo.y = moveTo.y;
            
            resizer1.x = innerMoveTo.x;
            resizer1.y = innerMoveTo.y;
            
            resizer2.x = innerMoveTo.x + Math.abs(Math.abs(_endValue) - Math.abs(_startValue)) * _k;
            resizer2.y = innerMoveTo.y;
            
            this.drawOuterSlider(moveTo.x, moveTo.y, _width - _leftPadding - _rightPadding, _sliderHeight, fromCache);
            this.drawDataView(moveTo.x, moveTo.y, _width - _leftPadding - _rightPadding, _sliderHeight, fromCache);
            this.drawInnerSlider(innerMoveTo.x, innerMoveTo.y, Math.abs(Math.abs(_endValue) - Math.abs(_startValue)) * _k, _sliderHeight, fromCache);  
            this.drawResizer(resizer1, resizer2, { direction: _direction, height: _sliderHeight, innerHeight: _resizerHeight, fromCache });
            this.setPointStyleHandler();
        }
        else {
            switch (_position) {
                case 'left':
                    moveTo.x = _x;
                    moveTo.y = _y + _leftPadding;
                    break;
                case 'center':
                    moveTo.x = _x + (_width - _sliderHeight)/2;
                    moveTo.y = _y + _leftPadding;
                    break;
                case 'right':
                    moveTo.x = _x + (_width - _sliderHeight);
                    moveTo.y = _y + _leftPadding;
                    break;
                default: 
                    moveTo.x = _x + (_width - _sliderHeight);
                    moveTo.y = _y + _leftPadding;
                    break;
            }
            innerMoveTo.x = moveTo.x;
            innerMoveTo.y = moveTo.y + _startValue*_k;
            
            resizer1.x = innerMoveTo.x;
            resizer1.y = innerMoveTo.y;
            
            resizer2.x = innerMoveTo.x;
            resizer2.y = innerMoveTo.y + Math.abs(Math.abs(_endValue) - Math.abs(_startValue)) * _k;

            this.drawOuterSlider(moveTo.x, moveTo.y, _sliderHeight, _height - _leftPadding - _rightPadding, fromCache);
            this.drawDataView(moveTo.x, moveTo.y, _sliderHeight, _height - _leftPadding - _rightPadding, fromCache);
            this.drawInnerSlider(innerMoveTo.x, innerMoveTo.y, _sliderHeight, Math.abs(Math.abs(_endValue) - Math.abs(_startValue)) * _k, fromCache);
            this.drawResizer(resizer1, resizer2, { direction: _direction, height: _sliderHeight, innerHeight: _resizerHeight, fromCache });
            this.setPointStyleHandler();
        }
    }

    // 绘制并更新外部块信息
    drawOuterSlider (x, y, width, height, fromCache) {
        if (this.outer.show) {
            // if (this.animation.renderShape_outer) { cancelAnimationFrame(this.animation.renderShape_outer) };
            // this.animation.renderShape_outer = requestAnimationFrame(() => {
                if (this.outer.stroke) {
                    x = x + 1;
                    width = width - 2;
                    y = y + 1;
                    height = height - 2;
                }
                fillRect(
                    this.canvas2dContext, 
                    x, 
                    y, 
                    width, 
                    height, 
                    this.outer.background || 'rgba(0,0,0,0)',
                    {
                        borderWidth: this.outer.stroke ? 1 : 0,
                        color: this.outer.stroke
                    }
                );
                
                merge_recursive(this.shapes.outer, { x, y, width, height, type: 'slider-outer' });
            // }, 10);
        }
    }

    // 绘制数据视图
    drawDataView (x, y, width, height, fromCache) {
        var time_1 = Date.now();
        
        var dataViewSetting = this.dataView,
            dataView = this.dataViewData,
            dataLen = dataView && dataView.length,
            direction = this.direction,
            min = this.min,
            max = this.max,
            data = fromCache ? this._dataViewData : [],
            first = getFirst(dataView) + '',
            beginIndex = 0,
            result,
            renderCurbe;

        
        if (!dataViewSetting.show) {
            return
        }

        if (!dataView || (dataView && !dataView.length)) {
            return
        }

        var timeTpl = first,
            toCale = direction === 'horizontal' ? width : height,
            scalek = linear([0, toCale], [min, max]), 
            curVal, maxVal;
        
        // 根据第一个作为模板, 将 min/max(毫秒数) 转换为相对应的格式
        // yyyy-MM-dd hh:mm:ss | yyyy:MM:dd hh:mm:ss | yyyy:MM:dd ...等
        // timeTpl = timeTpl.match(/[:\s-/|]/g);
        var matter = {0:'yyyy', 1: 'MM', 2: 'dd', 3: 'hh', 4: 'mm', 5: 'ss'};
        var i = 0;
        timeTpl = timeTpl.replace(/\d+/g, function (match, $1, index, str) {
            var tr = matter[i];
            i++;
            return match.length > 2 ? 'yyyy' : tr;
        });

        // 如果传递给视图的不为数值: 不符合统计的规律
        // 为日期格式开个特例:
        if (!fromCache) {
            if (typeof first === 'string') {

                // 几十万的大数组排序操作, 这会是性能耗费大户, 但为了后续取值的方便, 这一步是应该做的;
                dataView.sort((n1, n2) => { return n1 > n2 ? 1 : -1 });
                
                if (dataView.length < toCale) {
                    for (var i = 0, dataLen = dataView.length, date; i < dataLen; i++) {
                        curVal = dataView[i];
                        maxVal = dataView[i+1 >= dataLen ? dataLen - 1 : i + 1];

                        if (date = getDate(curVal)) {
                            
                            data.push({
                                x: scalek.setY(date.getTime()),
                                value: 1
                            });
                        }
                        renderCurbe = true;
                    }
                } else {
                    for (var i = 0; i < toCale; i++) {
                        curVal = formatDate(scalek.setX(i), timeTpl);
                        maxVal = formatDate(scalek.setX(i + 1), timeTpl);
                        
                        result = totalCountInAscArrByRange(dataView, [curVal, maxVal], beginIndex);
                        beginIndex = result.index[1];
                        data.push(result.value);
                        result = null;
                    }
                }

            } else {

                // 几十万的大数组排序操作, 这会是性能耗费大户, 但为了后续取值的方便, 这一步是应该做的;
                dataView.sort((n1, n2) => { return n1 > n2 ? 1 : -1 });

                if (dataView.length < toCale) {
                    for (var i = 0, dataLen = dataView.length, date; i < dataLen; i++) {
                        curVal = dataView[i];
                        maxVal = dataView[i+1 >= dataLen ? dataLen - 1 : i + 1];

                        if (date = getDate(curVal)) {
                            data.push({
                                x: date,
                                value: 1
                            });
                        }
                        renderCurbe = true;
                    }
                } else {
                    for (var i = 0; i < toCale; i++) {
                        curVal = formatDate(scalek.setX(i), timeTpl);
                        maxVal = formatDate(scalek.setX(i + 1), timeTpl);

                        result = totalCountInAscArrByRange(dataView, [curVal, maxVal], beginIndex);
                        beginIndex = result.index[1];
                        data.push(result.value);
                        result = null;
                    }
                }
            }
            
            this._dataViewData = data;
        }

        // 测试数据准确度;
        // var totel = data.reduce((preReturn, next) => preReturn + next, 0);
        if (data.length) {
            var extremum = getExtremum(data);
            
            var lineArea,
                _min = extremum.min,
                _max = extremum.max,
                scalek,
                dataLen = data.length;

            if (direction === 'horizontal') {
                scalek = linear([_min, _max], [height, 0]); // *0.9
                lineArea = new Line({x: x, y: y + height}, null, dataViewSetting.stroke, dataViewSetting.fill); // , {x: x, y: y + height}

                if (renderCurbe) {
                    for (var i = 0; i < dataLen; i++) {
                        lineArea.addPoint(data[i].x, y + scalek.setX(data[i].value));
                    }
                } else {
                    for (var i = 0; i < toCale; i++) {
                        lineArea.addPoint(x + i, y + scalek.setX(data[i]));
                    }
                }
            } else {
                scalek = linear([_min, _max], [width, 0]); // *0.9
                lineArea = new Line({x: x + width, y: y}, null, dataViewSetting.stroke, dataViewSetting.fill); // , {x: x + width, y: y}

                if (renderCurbe) {
                    for (var i = 0; i < dataLen; i++) {
                        lineArea.addPoint(x + scalek.setX(data[i].value), y + data[i].x);
                    }
                } else {
                    for (var i = 0; i < toCale; i++) {
                        lineArea.addPoint(x + scalek.setX(data[i]), y + i);
                    }
                }
            }

            // 依据宽度/高度, 连续取样;
            lineArea.addPoint(x + width, y + height);

            if (renderCurbe) {
                // lineArea.createCurvePath(this.canvas2dContext);
            }
            if (lineArea) {
                lineArea.fill(this.canvas2dContext);
            }
            lineArea = null;
        }
        var time_2 = Date.now();
    }

    // 起点, 终点, 线的布局和基本占比
    drawResizer (start, end, linkStyle) {
        var {direction, height, innerHeight} = linkStyle;
        var {show, formatter, textStyle} = this.boundaryText; 
        var {color, width, position} = this.resizerStyle;

        // if (this.animation.renderShape_resize) { cancelAnimationFrame(this.animation.renderShape_resize) };
        // this.animation.renderShape_resize = requestAnimationFrame(() => {

            [start, end].map((resizer, index) => {
                var value, calcPosition;
                if (direction === 'horizontal') {
                    value = this.linearScaleValueWithWidth.setY(resizer.x);
    
                    fillLine(
                        this.canvas2dContext,
                        {x: resizer.x, y: resizer.y},
                        {x: resizer.x, y: resizer.y + height},
                        {color: color}
                    );
                    switch (position) {
                        case 'inner':
                            calcPosition = index === 0 ? resizer.x : resizer.x - width;
                            break;
                        case 'center':
                            calcPosition = resizer.x - width/2;
                            break;
                        case 'outer':
                            calcPosition = index === 0 ? resizer.x - width : resizer.x;
                            break;
                    }
                    fillRect(
                        this.canvas2dContext,
                        calcPosition, // resizer.x - width/2,
                        resizer.y + (height-innerHeight)/2,
                        width,
                        innerHeight,
                        color
                    );
                    
                    if (show) {
                        fillText(
                            this.canvas2dContext,
                            index===0 ? resizer.x - width/2 - 2 : resizer.x + width/2 + 2,
                            resizer.y + height/2,
                            typeOf(formatter) === 'function' ? formatter(value) : value,
                            { ...textStyle, align: index===0 ? 'right' : 'left', verticle: 'middle' }
                        );
                    }
                    
    
                    merge_recursive(this.shapes[index===0 ? 'resizeLeft' : 'resizeRight'], {
                        x: resizer.x - width/2, 
                        // y: resizer.y, 
                        y: resizer.y + (height-innerHeight)/2,
                        width,
                        // height,
                        height: innerHeight,
                        type: 'resize-' + (index === 0 ? 'L' : 'R')
                    });
                } else {
                    value = this.linearScaleValueWithWidth.setY(resizer.y);
    
                    fillLine(
                        this.canvas2dContext,
                        {x: resizer.x, y: resizer.y},
                        {x: resizer.x + height, y: resizer.y},
                        {color: color}
                    );
                    switch (position) {
                        case 'inner':
                            calcPosition = index === 0 ? resizer.y : resizer.y - width;
                            break;
                        case 'center':
                            calcPosition = resizer.y - width/2;
                            break;
                        case 'outer':
                            calcPosition = index === 0 ? resizer.y - width : resizer.y;
                            break;
                    }
                    fillRect(
                        this.canvas2dContext,
                        resizer.x + (height-innerHeight)/2,
                        calcPosition, // resizer.y - width/2,
                        innerHeight,
                        width,
                        color
                    );
    
                    if (show) {
                        var txt = calcBreakWord(
                            typeOf(formatter) === 'function' ? formatter(value) : value + '',
                            innerHeight,
                            textStyle.fontSize
                        );
    
                        var totallen = txt.length;
                        var baseY;
    
                        if (index === 0) {
                            baseY = resizer.y - width/2; //  - 2
    
                            for (var i = 1; i <= txt.length; i++) {
                                fillText(
                                    this.canvas2dContext,
                                    resizer.x + height/2,
                                    baseY - textStyle.fontSize * totallen,
                                    txt[i],
                                    { ...textStyle, align: 'center', verticle: 'bottom' }
                                );
                                totallen--;
                            }
                        } else {
                            baseY = resizer.y + width/2 + 2;
    
                            for (var i = 1; i <= txt.length; i++) {
                                fillText(
                                    this.canvas2dContext,
                                    resizer.x + height/2,
                                    baseY + textStyle.fontSize * (i-1),
                                    txt[i],
                                    { ...textStyle, align: 'center', verticle: 'top' }
                                )
                            }
                        }
                        // fillText(
                        //     this.canvas2dContext,
                        //     resizer.x + height/2,
                        //     index===0 ? resizer.y - width/2 - 2 : resizer.y + width/2 + 2,
                        //     typeOf(formatter) === 'function' ? formatter(value) : value,
                        //     { ...textStyle, align: 'center', verticle: index===0 ? 'bottom' : 'top' }
                        // );
                    }
                    
                    merge_recursive(this.shapes[index===0 ? 'resizeLeft' : 'resizeRight'], {
                        // x: resizer.x, 
                        x: resizer.x + (height-innerHeight)/2,
                        y: resizer.y - width/2, 
                        height: innerHeight,
                        // height: width,
                        // width,
                        width: height,
                        type: 'resize-' + (index === 0 ? 'L' : 'R')
                    });
                }
            });
        // }, 0);
    }

    // canvas原生 API, 坐标点是否在路径内
    isPointInPath (context, x, y) {
        return context.isPointInPath(x, y);
    }

    // 判断点是否在某一个矩形方块内:
    // block: x1, x2, y1, y2; point: x, y;
    isPointInBlock (block, point) {
        return block.x1 <= point.x && block.x2 >= point.x && block.y1 <= point.y && block.y2 >= point.y;
    }

    drawInnerSlider (x, y, width, height) {
        if (this.inner.show) {
            // if (this.animation.renderShape_inner) { cancelAnimationFrame(this.animation.renderShape_inner) };
            // this.animation.renderShape_inner = requestAnimationFrame(() => {
                if (this.inner.stroke) {
                    x = x + 1;
                    width = width - 2;
                    y = y + 1;
                    height = height - 2;
                }
                fillRect(
                    this.canvas2dContext, 
                    x, 
                    y, 
                    width, 
                    height, 
                    this.inner.background || 'rgba(0,0,0,0)',
                    {
                        borderWidth: this.inner.stroke ? 1 : 0,
                        color: this.inner.stroke
                    }
                );
    
                // this.canvas2dContext.save();
                // this.canvas2dContext.restore();
                merge_recursive(this.shapes.inner, {x, y, width, height, type: 'slider-inner'});
                // this.shapes.inner = { x, y, width, height, type: 'slider-inner' };
            // }, 0);
        }
    }


    initEventHandler () {
        if (this.eventManager) {
            // this.eventManager.removeEvent('mousedown', this.saveDrag);
            // this.eventManager.removeEvent('mousemove', this.moveSlider);
            // this.eventManager.removeEvent('mouseleave', this.clearDrag);
            // this.eventManager.removeEvent('mouseup', this.clearDrag);
            // this.eventManager.removeEvent('mousemove', this.resizeSlider);
            // this.eventManager.removeEvent('mouseup', this.clearResizer);
            // this.eventManager.removeEvent('mouseleave', this.clearResizer);
            // this.eventManager.removeEvent('mouseup', this.selectTimeRange);

            // for (var i = 0; i < this.eventRecord.length; i++ ) {
            //     this.eventManager.disposeAll(this.eventRecord[i]);
            // };

            this.eventManager.addEvent('mousedown', this.saveDrag); // { x1: this.x, y1: this.y, x2: this.x + this.width, y2: this.y + this.height } 
        }
    }

    saveDrag = (e, canvas, data) => {
        var _this = this,
            x = e.x || e.clientX,
            y = e.y || e.clientY,
            location = e.zrX !== undefined ? { x: e.zrX, y: e.zrY, delta: e.zrDelta } : pointToDom(x, y, canvas),
            hasShape = false,
            componentBlock = {x1: this.x, x2: this.x + this.width, y1: this.y, y2: this.y + this.height};
        
        // 如果有多个实例时, 限制在鼠标所在的实例
        if (!_this.isPointInBlock(componentBlock, location)) {
            return
        } 
        
        // 顺序是有意放置的, 以设置正确的拖动形状: 优先重置大小的小按钮, 再是滑动块
        [_this.shapes.outer, _this.shapes.inner, _this.shapes.resizeLeft, _this.shapes.resizeRight].forEach(function(shape, index){
            if (shape) {
                var block = {x1: shape.x, x2: shape.x + shape.width, y1: shape.y, y2: shape.y + shape.height};

                if (_this.isPointInBlock(block, location)) {
                    hasShape = true;
                    // _this.moveSlider.silence = index !== 0;
                    _this.shapeBeingDragged = shape;
                    _this.mousedown.x = location.x;
                    _this.mousedown.y = location.y;
                    _this.lastdrag.x = location.x;
                    _this.lastdrag.y = location.y;
                }
            }
        });

        if (hasShape) {
            _this.resizeSlider.silence = this.shapeBeingDragged.type.search('resize') === -1;
            _this.clearResizer.silence = this.shapeBeingDragged.type.search('resize') === -1;
            _this.moveSlider.silence = this.shapeBeingDragged.type !== 'slider-inner';
            _this.clearDrag.silence = this.shapeBeingDragged.type !== 'slider-inner';
            _this.selectTimeRange.silence = this.shapeBeingDragged.type !== 'slider-outer';

            if (this.shapeBeingDragged.type === 'slider-inner') {
                _this.eventManager.addEvent('mousemove', _this.moveSlider);
                _this.eventManager.addEvent('mouseleave', _this.clearDrag);
                _this.eventManager.addEvent('mouseup', _this.clearDrag);
            } else if (this.shapeBeingDragged.type.search('resize') !== -1) {                
                _this.saveResize(this.shapeBeingDragged);
                _this.eventManager.addEvent('mousemove', _this.resizeSlider);
                _this.eventManager.addEvent('mouseup', _this.clearResizer);
                _this.eventManager.addEvent('mouseleave', _this.clearResizer);
            } else if (this.shapeBeingDragged.type === 'slider-outer') {
                _this.eventManager.addEvent('mouseup', _this.selectTimeRange);
            }
        }
    }

    saveResize (shape) {
        this.lastSize = {
            ...shape,
            values: [this.startValue, this.endValue]
        };
    }

    clearResizer = () => {
        this.shapeBeingDragged = undefined;
        this.eventManager.removeEvent('mousemove', this.resizeSlider);
        this.eventManager.removeEvent('mouseup', this.clearResizer);
        this.eventManager.removeEvent('mouseleave', this.clearResizer);
        this.emit('datazoom-resize' + this.uid);
    }

    // 出于性能考虑: 必须加入放大控制的功能: 某些场景下这些控制是必须的; 但仍然可以执行缩小的操作: 
    // 对于 百万级/千万级的超大数据, 配合使用 dataZoom可以对数据进行快速定位切片, 且仅可在一个安全的范围 safeValueRange进行缩放
    resizeSlider = (e, canvas) => {
        var x = e.x || e.clientX,
            y = e.y || e.clientY,
            location,
            dragVector;

        // 如果不可缩放
        if (!this.resizeable) {
            return
        }

        this.once = false;
        if (this.shapeBeingDragged !== undefined) {
            location = e.zrX !== undefined ? { x: e.zrX, y: e.zrY, delta: e.zrDelta } : pointToDom(x, y, canvas);
            dragVector = { x: location.x - this.lastSize.x,
                            y: location.y - this.lastSize.y
                        };
            
            var sliderShape = this.shapes.inner;
            var startRange, newStartPos, newEndPos, cp;
            if (this.direction === 'horizontal') {

                startRange = [sliderShape.x - this.resizerStyle.width / 2, sliderShape.x + (this.resizerStyle.width / 2)];
                if (isInRange(this.lastSize.x, startRange)) {
                    newStartPos = this.lastSize.x + dragVector.x;
                    newEndPos = sliderShape.x + sliderShape.width;
                    cp = newEndPos;

                    newEndPos = newEndPos > newStartPos ? newEndPos : newStartPos;
                    newStartPos = cp > newStartPos ? newStartPos : cp;
                    
                    
                } else {
                    newEndPos = this.lastSize.x + dragVector.x;
                    newStartPos = sliderShape.x;
                    cp = newEndPos;

                    newEndPos = newEndPos > newStartPos ? newEndPos : newStartPos;
                    newStartPos = cp > newStartPos ? newStartPos : cp;
                }
            } else {
                startRange = [sliderShape.y - this.resizerStyle.width / 2, sliderShape.y + this.resizerStyle.width / 2];

                if (isInRange(this.lastSize.y, startRange)) {
                    newStartPos = this.lastSize.y + dragVector.y;
                    newEndPos = sliderShape.y + sliderShape.height;
                    cp = newEndPos;

                    newEndPos = newEndPos > newStartPos ? newEndPos : newStartPos;
                    newStartPos = cp > newStartPos ? newStartPos : cp;
                    
                    
                } else {
                    newEndPos = this.lastSize.y + dragVector.y;
                    newStartPos = sliderShape.y;
                    cp = newEndPos;

                    newEndPos = newEndPos > newStartPos ? newEndPos : newStartPos;
                    newStartPos = cp > newStartPos ? newStartPos : cp;
                }
            }
            
            var newStartValue = this.linearScaleKWithValue.setY(this.linearScaleValueWithWidth.setY(newStartPos));
            var newEndValue = this.linearScaleKWithValue.setY(this.linearScaleValueWithWidth.setY(newEndPos));

            // 如果不可放大: 那么控制缩放范围到一个安全的值
            if (!this.resizeToMaxAble) {
                if (newEndValue - newStartValue >= this.safeValueRange) {
                    newEndValue = newStartValue + this.safeValueRange;
                }
            }
            // 如果不可缩小: 那么控制缩放范围至少要大于某一个值
            if (!this.resizeToMinAble) {
                if (newEndValue - newStartValue <= this.safeValueRange) {
                    newEndValue = newStartValue + this.safeValueRange;
                }
            }

            newStartValue = newStartValue <= 0 ? 0 : newStartValue;
            newEndValue = newEndValue >= 100 ? 100 : newEndValue;
            
            this.startValue = newStartValue;
            this.endValue = newEndValue;

            this.lastSize.x = location.x;
            this.lastSize.y = location.y;
            this.erase();
            this.drawSliders(true);

            // 取消触发 moving 事件, 滑块重置大小过程中如果重筛选数据, 在大量数据时会造成明显卡顿: 这是一个待优化的地方, 目前暂没想到好办法
            // this.emit('datazoom-moving' + this.uid);
        }
    }

    // 内滑块拖动过程中的处理
    moveSlider = (e, canvas) => {
        var x = e.x || e.clientX,
            y = e.y || e.clientY,
            location,
            dragVector;

        this.once = false;
        if (this.shapeBeingDragged !== undefined) {
            location = e.zrX !== undefined ? { x: e.zrX, y: e.zrY, delta: e.zrDelta } : pointToDom(x, y, canvas);
            dragVector = { x: location.x - this.lastdrag.x,
                            y: location.y - this.lastdrag.y
                        };

            this.updateValueRange(this.shapes.inner, dragVector.x, dragVector.y);
            
            this.lastdrag.x = location.x;
            this.lastdrag.y = location.y;
            this.erase();
            this.drawSliders(true);
            this.emit('datazoom-moving' + this.uid);
        }
    }

    // 内滑块拖动结束的处理;
    clearDrag = (e, canvas, data) => {
        this.shapeBeingDragged = undefined;
        this.eventManager.removeEvent('mousemove', this.moveSlider);
        this.eventManager.removeEvent('mouseup', this.clearDrag);
        this.eventManager.removeEvent('mouseleave', this.clearDrag);
        this.emit('datazoom-move' + this.uid);
    }

    // 外滑块点击某一位置时候的处理;
    selectTimeRange = (e, canvas) => {
        var x = e.x || e.clientX,
            y = e.y || e.clientY,
            location;

        this.once = false;
        if (this.shapeBeingDragged !== undefined) {
            location = e.zrX !== undefined ? { x: e.zrX, y: e.zrY, delta: e.zrDelta } : pointToDom(x, y, canvas);

            this.updateValueRange(this.shapes.inner, location.x - this.shapes.inner.x - this.shapes.inner.width/2, location.y - this.shapes.inner.y);

            this.erase();
            this.drawSliders(true);
            this.emit('datazoom-select' + this.uid);
            
            this.eventManager.removeEvent('mouseup', this.selectTimeRange);
        }
    }

    // 更新滑块值位置:
    updateValueRange (innerSliderShape, moveX, moveY) {
        var newStartValuePos, newEndValuePos,
            newStartValue, newEndValue;

        // 横向
        if (this.direction === 'horizontal') {
            newStartValuePos = innerSliderShape.x + moveX;
            newEndValuePos =  innerSliderShape.x + innerSliderShape.width + moveX;
        }
        // 纵向 
        else {
            newStartValuePos = innerSliderShape.y + moveY;
            newEndValuePos =  innerSliderShape.y + innerSliderShape.height + moveY;        
        }

        newStartValue = this.linearScaleKWithValue.setY(this.linearScaleValueWithWidth.setY(newStartValuePos));
        newEndValue = this.linearScaleKWithValue.setY(this.linearScaleValueWithWidth.setY(newEndValuePos));

        if (newStartValue <= 0) {
            this.endValue = this.endValue - this.startValue + 0;
            this.startValue = 0;
        } else if (newEndValue >= 100) {
            this.startValue = 100 - (this.endValue - this.startValue);
            this.endValue = 100;
        } else {
            this.startValue = newStartValue < newEndValue ? newStartValue : newEndValue;
            this.endValue = newEndValue > newStartValue ? newEndValue : newStartValue;
        }
    }


    // 派发事件;
    // {@param.eventType} 当存在多个实例时, 如果事件类型不唯一, 且未加其他控制条件:比如事件发生的位置限制, 可能会派发出多个事件; 为了简化调用者的逻辑, 组件内部维护了一个 uid;
    //                      每次注册/派发事件时, 额外加上这个 uid, 以此控制事件类型的唯一;
    emit (eventType) {
        var startValue = this.linearScaleKWithValue.setX(this.startValue);
        var endValue = this.linearScaleKWithValue.setX(this.endValue);
        var {formatter} = this.boundaryText;
        if (typeOf(formatter) === 'function') {
            startValue = formatter(startValue);
            endValue = formatter(endValue);
        }

        this.eventManager.dispatchEvent(eventType, {
            value: [startValue, endValue],
            percent: [this.startValue, this.endValue]
        });
    }

    // 注册事件: 支持为某一个类型事件注册多个回调函数; 
    // {@param.eventType} 事件类型; 支持的事件类型有: resize, moving, move, select;
    // {@param.eventDesc} 事件描述
    // {@param.cb} 要执行的回调;
    on (eventType, eventDesc, cb) {
        if (cb === undefined && typeof eventDesc === 'function') {
            cb = eventDesc;
            eventDesc = null;
        }
        this.eventManager.addEvent('datazoom-' + eventType + this.uid, eventDesc, cb);

        eventType = 'datazoom-' + eventType + this.uid;
        if (this.eventRecord.indexOf(eventType) !== -1) {
            this.eventRecord.push(eventType);
        }
    }

    // 考虑的扩展;
    extend (pluginClass) {
        var standardPlugin = merge_recursive({
            name: 'plugin_' + getUUid(),
            init: function () {},
            update: function () {},
            install: function () {},
            uninstall: function () {}
        }, pluginClass);

        this.plugins.push(standardPlugin);
    }

    // 获取到插件实例;
    getPlugin (name) {
        return this.plugins.find(item => item.name === name);
    }

    // 销毁实例: 清除事件, 清除引用, 清除属性;
    destroy () {
        if (this.eventManager) {
            this.eventManager.removeEvent('mousedown', this.saveDrag);
            this.eventManager.removeEvent('mousemove', this.moveSlider);
            this.eventManager.removeEvent('mouseleave', this.clearDrag);
            this.eventManager.removeEvent('mouseup', this.clearDrag);
            this.eventManager.removeEvent('mousemove', this.resizeSlider);
            this.eventManager.removeEvent('mouseup', this.clearResizer);
            this.eventManager.removeEvent('mouseleave', this.clearResizer);
            this.eventManager.removeEvent('mouseup', this.selectTimeRange);

            for (var i = 0; i < this.eventRecord.length; i++ ) {
                this.eventManager.disposeAll(this.eventRecord[i]);
            };

            for (var key in this.shapes) {
                this.eventManager.removeRegisterBlock('dataZoom-' + key + this.uid);
            }
        }

        for (var key in this.animation) {
            if (this.animation[key]) {
                cancelAnimationFrame(this.animation[key]);
            }
        }

        this.plugins.forEach(plugin => {
            plugin.uninstall();
        });

        for (var key in this) {
            delete this[key];
        }
    }
}

export default dataZoom;

export {
    dataZoom
}