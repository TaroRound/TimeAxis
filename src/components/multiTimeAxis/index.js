import { linear, typeOf, merge_recursive, calcTextWidth, getSysFont, getUUid, formatDate, getWeek, getDate, scaleTime } from '../../lib/util/index';
import fillRect from '../../shape/rect';
import fillLine from "../../shape/line";
import fillText from "../../shape/text";

/**
 * 绘制刻度尺方法; 对于一串规则排列的文本, 此方法大体上适用;
 *  目前这个文本是一个顺序的数值, 且根据数值等分计算, 并建立线性比例来纠正偏移量操作的; 这种做法有很大局限性就是仅仅支持数值的情况;
 *  如果是一串非数值文本, 那么实现上应该顺序取文本且不存在所谓偏移量, 按照一个个目录的形式排列文字即可;
 *  
 * 特别说明, 像刻度尺常常是要求可以操作的, 常见的有点击, 双击, 右键, 选中, 文字旋转, 文字占满自动计算显示项等;
 *  但这里省略了部分, 不再处理文字旋转的情况, 右键,双击事件目前均没有实现;
 *  
 * 在事件处理上, 由于该组件可能会被多次实例化, 因此把方法放在了具体的实例上, 这个做法和 DataZoom组件的实现是一致的;
 *  因为设计事件代理时, 是为每一个函数设置了属性 silence, uid 这些的, 如果把这些方法放到原型对象中, 就会导致多个实例时, 重复设置了同一个函数的值, 这会导致问题, 因此把这些方法放到了实例中;
 */
class MultiTimeAxis {
    constructor (canvas2dContext, {
        direction,
        x,
        y,
        width,
        height,
        boundary,
        leftPadding,
        rightPadding,
        background,
        backgroundOrigin,
        timeunit,
        min,
        max,
        interval,
        timeReader,
        timeScale,
        tickStyle
    }, eventHandler, canvas) {
        this.uid = getUUid();
        this.canvas2dContext = canvas2dContext;
        this.direction = direction;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.boundary = boundary || [0, 0];
        this.leftPadding = leftPadding || 0;
        this.rightPadding = rightPadding || 0;
        this.background = background;
        this.backgroundOrigin = backgroundOrigin;
        this.timeunit = timeunit;
        this.min = min;
        this.max = max;
        this.interval = interval || 8;
        this.timeReader = timeReader || getDate;
        this.timeReaderToValue = timeScale || null;
        this.tickStyle = merge_recursive({
            normal: {
                fontSize: 12,
                color: '#666'
            },
            emphasis: {
                fontSize: 12,
                color: 'red'
            }
        }, tickStyle);

        this.eventHandler = eventHandler || {};
        this.eventRecord = [];
        this.registerBlocks = [];
        this.eventHelp = {};
        this.timeScale = null;
        this.animation = {};

        this.init();
    }

    init () {
        this.createScale();

        this.drawBackground();
        this.removeRegisterBlock();
        this.drawChart();
        // this.addRegisterBlock();
    }

    // 修正偏差, 时间节点可能并不是从 0位开始, 所以需要偏移到准确的位置:
    createScale () {}


    // 根据一个给定的时间区间, 返回一个"固定数量"的刻度尺文本
    autoFixXTicks (startTime, endTime, interval) {
        if (startTime && endTime) {
            var _endTime = endTime;
            if (_endTime < startTime) {
                endTime = startTime;
                startTime = _endTime;
            }
        }
        var toTransFormatter = new Date('2018-01') == 'Invalid Date',
            ticks = [],
            startDateInstance,
            endDateInstance,
            oneDayTimes = 86400000,
            timeReader;

        if (typeOf(startTime) === 'number' || typeOf(startTime) === 'date') {
            startDateInstance = this.timeReader(startTime);
        } else if (typeOf(startTime) === 'string') {
            startDateInstance = this.timeReader(toTransFormatter ? startTime.replace(/-/g, '/') : startTime )
        }
        if (typeOf(endTime) === 'number' || typeOf(endTime) === 'date') {
            endDateInstance = this.timeReader(endTime);
        } else if (typeOf(endTime) === 'string') {
            endDateInstance = this.timeReader(toTransFormatter ? endTime.replace(/-/g, '/') : endTime )
        }

        var returnSecond = function (t) { return formatDate(t, 'yyyy-MM-dd hh:mm:ss') };
        var returnMinute = function (t) { return formatDate(t, 'yyyy-MM-dd hh:mm') };
        var returnHour = function (t) { return formatDate(t, 'yyyy-MM-dd hh:00') };
        var returnDay = function (t) { return formatDate(t, 'yyyy-MM-dd') };
        var returnMonth = function (t) { return formatDate(t, 'yyyy-MM') };
        var returnYear = function (t) { return formatDate(t, 'yyyy') };
        var returnWeek = function (t) { return getDate(t).getFullYear() + '第 ' + getWeek(t) + '周' }
        var timeFactory = scaleTime().domain([new Date(startDateInstance), new Date(endDateInstance)]);
        // console.log('传入的时间值', returnDay(startDateInstance), returnDay(endDateInstance));
        // console.log('借助于d3.scaleTime', [...timeFactory.ticks(interval)].map( returnDay ) , [...timeFactory.ticks(timeDay.every(5))].map( returnDay ));

        var distance = endDateInstance - startDateInstance;
        // 两小时之内: 返回秒
        if (0 <= distance && distance <= oneDayTimes / 12) {
            // returnSecond(startDateInstance), , returnSecond(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnSecond;
        }
        // 超过两小时, 小于六小时, 返回分
        else if (oneDayTimes / 12 < distance && distance <= oneDayTimes / 2) {
            // returnMinute(startDateInstance), , returnMinute(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnMinute;
        }
        // 大于六小时, 小于三天, 返回小时
        else if (oneDayTimes / 2 < distance && distance <= oneDayTimes * 3) {
            // returnHour(startDateInstance), , returnHour(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnHour;
        }
        // 大于三天, 小于30天, 返回天
        else if (oneDayTimes * 3 < distance && distance <= oneDayTimes * 30) {
            // returnDay(startDateInstance), , returnDay(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnDay;
        }
        // 大30天, 小于180天, 返回周
        else if (oneDayTimes * 30 < distance && distance <= oneDayTimes * 180) {
            // returnWeek(startDateInstance), , returnWeek(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnWeek;
        }
        // 大于180天, 小于5年, 返回月
        else if (oneDayTimes * 180 < distance && distance <= oneDayTimes * 365 * 5) {
            // returnMonth(startDateInstance), , returnMonth(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnMonth;
        }
        // 大于 5年, 返回年
        else {
            // returnYear(startDateInstance), , returnYear(endDateInstance)
            ticks = [...timeFactory.ticks(interval)];
            timeReader = returnYear;
        }

        return {ticks, timeReader}
    }

    // 绘制刻度尺背景
    drawBackground () {

        if (this.background) {
            var x, y, width, height, background;
            switch (this.backgroundOrigin) {
                case 'border-box':
                    x = this.x;
                    y = this.y;
                    width = this.width;
                    height = this.height;
                    background = this.background;
                    break;
                case 'content-box':
                    if (this.direction === 'horizontal') {
                        x = this.x + this.leftPadding;
                        y = this.y;
                        width = this.width - this.leftPadding - this.rightPadding; //this.boundary[0] - this.boundary[1];
                        height = this.height;
                        background = this.background;
                    } else {
                        x = this.x;
                        y = this.y + this.leftPadding;
                        width = this.width; //this.boundary[0] - this.boundary[1];
                        height = this.height - this.leftPadding - this.rightPadding;
                        background = this.background;
                    }
                    
                    break;
                default:
                    x = this.x;
                    y = this.y;
                    width = this.width;
                    height = this.height;
                    background = this.background;
                    break;
            };
            fillRect(
                this.canvas2dContext,
                x,
                y,
                width,
                height,
                background
            );
        }
    }

    // 绘制刻度尺
    drawChart () {
        // if (this.animation.render_chart) { cancelAnimationFrame(this.animation.render_chart) };
        // this.animation.render_chart = requestAnimationFrame(() => {
            var {ticks, timeReader} = this.autoFixXTicks(parseInt(this.min), parseInt(this.max), this.interval),
                timeReaderToValue = this.timeReaderToValue,
                _registerBlocks = this.registerBlocks,
                textStyle = this.tickStyle.normal,
                scaleK;
            _registerBlocks.length = 0;

            if (this.direction === 'horizontal') {
                scaleK = linear(
                            [this.min, this.max], 
                            [
                                this.x + this.leftPadding + this.boundary[0], 
                                this.x + this.leftPadding + this.boundary[0] + this.width - this.leftPadding - this.rightPadding - this.boundary[0] - this.boundary[1]
                            ]
                        );
                var oneTickWidth = calcTextWidth(timeReader(ticks[0]), textStyle.fontSize + 'px ' + getSysFont(''), this.canvas2dContext);
                var stackWidth = this.x;
                ticks.map((date, i) => {
                    var _x = typeOf(timeReaderToValue) === 'function' ? scaleK.setX(timeReaderToValue(date)) : scaleK.setX(date.getTime());
                    
                    fillLine(
                        this.canvas2dContext,
                        {x: _x, y: this.y },
                        {x: _x, y: this.y + 6},
                        {
                            lineWidth: 1,
                            color: '#ccc'
                        }
                    );
                    if (_x >= stackWidth) {
                        fillText(
                            this.canvas2dContext,
                            _x,
                            this.y + 8,
                            timeReader(date),
                            {
                                color: textStyle.color,
                                fontSize: textStyle.fontSize,
                                align: 'center',
                                verticle: 'top'
                            }
                        );
                        stackWidth = _x + oneTickWidth;
                        _registerBlocks.push({
                            x: _x - oneTickWidth/2,
                            y: this.y + 8,
                            width: oneTickWidth,
                            height: textStyle.fontSize,
                            text: timeReader(date),
                            select: false
                        });
                    }
                });
            } else {
                scaleK = linear(
                    [this.min, this.max], 
                    [
                        this.y + this.leftPadding + this.boundary[0], 
                        this.y + this.leftPadding + this.boundary[0] + this.height - this.leftPadding - this.rightPadding - this.boundary[0] - this.boundary[1]
                    ]
                );
                var time1 = Date.now();
                var oneTickWidth = calcTextWidth(timeReader(ticks[0]), textStyle.fontSize + 'px ' + getSysFont(''), this.canvas2dContext);
                

                ticks.map((date, i) => {
                    var _y = typeOf(timeReaderToValue) === 'function' ? scaleK.setX(timeReaderToValue(date)) : scaleK.setX(date.getTime());
                    fillLine(
                        this.canvas2dContext,
                        {x: this.x, y: _y },
                        {x: this.x + 6, y: _y},
                        {
                            lineWidth: 1,
                            color: '#ccc'
                        }
                    );
                });

                this.canvas2dContext.save();
                var last = {x: 0, y: 0};
                ticks.map((date, i) => {
                    var _y = typeOf(timeReaderToValue) === 'function' ? scaleK.setX(timeReaderToValue(date)) : scaleK.setX(date.getTime());

                    var curPos = {
                        x: this.x + 8,
                        y: _y
                    }
                    this.canvas2dContext.translate(curPos.x, curPos.y); //我的Canvas 画布是300 * 300的 这次将旋转的原点设在中间的位置
                    this.canvas2dContext.rotate(Math.PI * 0.5);

                    

                    fillText(
                        this.canvas2dContext,
                        // this.x + 8,
                        // _y,
                        0,
                        0,
                        timeReader(date),
                        {
                            color: textStyle.color,
                            fontSize: textStyle.fontSize,
                            align: 'center',
                            verticle: 'bottom',
                            direction: 'verticle'
                        }
                    );
                    last.x += this.x + 8;
                    last.y += _y;
                    // this.canvas2dContext.translate(0, 0);
                    // this.canvas2dContext.rotate(-Math.PI * 0.5);
                    this.canvas2dContext.setTransform(1, 0, 0, 1, 0, 0);
                    
                    _registerBlocks.push({
                        x: curPos.x,
                        y: curPos.y - oneTickWidth/2,
                        width: textStyle.fontSize,
                        height: oneTickWidth,
                        text: timeReader(date),
                        select: false
                    });
                });
                // this.canvas2dContext.rotate(0);
                this.canvas2dContext.restore();
                this.canvas2dContext.translate(0, 0);

                var time2 = Date.now();
                // console.log('绘制文本所耗时间',);
            }
        // }, 16);
    }

    // 有个bug, 绘制文本时可能会超出便捷而导致无法擦除;
    erase () {
        this.canvas2dContext.clearRect(this.x, this.y, this.width, this.height);
    }

    // 添加点击区域;
    addRegisterBlock (eventDesc) {
        if (this.eventHandler) {
            var blocks = this.registerBlocks || [];
            var blockLen = blocks.length;
            var condition;

            eventDesc = eventDesc || {};

            for (var i = 0; i < blockLen; i++) {
                var {x, y, width, height, text} = blocks[i];
                
                // 事件代理添加事件时, 默认阻止了一个事件的重复注册
                this.tickClickHandler.$repeat = true;

                if (eventDesc && eventDesc.hasOwnProperty('dataIndex')) {
                    condition = Array.isArray(eventDesc.dataIndex) 
                                    ? eventDesc.dataIndex.some(v => v === i || v === text )
                                    : eventDesc.dataIndex == i || eventDesc.dataIndex == text;
                } else {
                    condition = true;
                }
                if (condition) {
                    this.eventHandler.registerEventStyleInBlockModel({
                        id: 'timetick-' + text,
                        style: 'pointer',
                        block: {
                            x1: x,
                            y1: y,
                            x2: x + width,
                            y2: y + height
                        },
                        zIndex: 1
                    });

                    this.eventHandler.addEvent('click', {   // 触发事件时, 需要传递的一些"静态"变量
                        dataValue: text,     
                        dataIndex: i,
                        dataList: blocks,
                        block: {    // 为当前注册的 点击事件声明区域信息
                            x1: x,
                            y1: y,
                            x2: x + width,
                            y2: y + height
                        }
                    }, this.tickClickHandler, this);
                }
            }
        }
    }

    // 设置点击项高亮
    setHighLight (textBlock) {
        // 如果是个渐变色就麻烦了, 那这个就会出现点击区域颜色异常;
        var tickBg = this.background,
            {x, y, width, height, text} = textBlock,
            textStyle;

        textBlock.select = !textBlock.select;
        textStyle = this.tickStyle[textBlock.select ? 'emphasis' : 'normal'];
        this.canvas2dContext.clearRect(x, y, width, height);

        if (this.direction === 'vertical') {
            this.canvas2dContext.save();
            this.canvas2dContext.translate(x, y);
            this.canvas2dContext.rotate(Math.PI * 0.5);

            fillRect(
                this.canvas2dContext,
                0,
                0 - width,
                height,
                width,
                tickBg||'#fff'
            );

            fillText(
                this.canvas2dContext,
                0 + height/2,
                0,
                text,
                {
                    color: textStyle.color,
                    fontSize: textStyle.fontSize,
                    align: 'center',
                    verticle: 'bottom'
                }
            );

            this.canvas2dContext.restore();
            this.canvas2dContext.setTransform(1, 0, 0, 1, 0, 0);
            this.canvas2dContext.translate(0, 0);
        } else {
            fillRect(
                this.canvas2dContext,
                x,
                y,
                width,
                height,
                tickBg||'#fff'
            );
            fillText(
                this.canvas2dContext,
                x + width/2,
                y,
                text,
                {
                    color: textStyle.color,
                    fontSize: textStyle.fontSize,
                    align: 'center',
                    verticle: 'top'
                }
            );
        }
    }

    // 刻度尺点击时候的回调函数;
    tickClickHandler = (event, canvas, data) => {
        var curBlock = this.registerBlocks[data.dataIndex];

        if (this.eventHelp['addRegisterBlock']) {
            this.setHighLight(curBlock);
        }

        this.emit('timetickClick', data, event);
        this.emit('timetickSelect', this.registerBlocks.map(block => block.select), event);
    }

    // 清除可点击状态; 
    // 清除点击事件;
    removeRegisterBlock () {
        if (this.eventHandler) {
            var blocks = this.registerBlocks || [];
            var blockLen = blocks.length;
            for (var i = 0; i < blockLen; i++) {
                this.eventHandler.removeRegisterBlock('timetick-' + blocks[i].text);
                this.eventHandler.removeEvent('click', this.tickClickHandler);
            }
        }
    }

    // 更新
    update (config) {
        merge_recursive(this, config);
        this.erase();
        this.drawBackground();
        this.removeRegisterBlock();
        this.drawChart();
        // 如果文本挂载的有事件;
        if (this.eventHelp['addRegisterBlock']) {
            if (this.timer) {
                clearTimeout(this.timer)
            }

            this.timer = setTimeout(()=>{
                this.addRegisterBlock(this.eventHelp['timetickClick']);
            },  16);
        }
    }

    // 派发事件
    emit (eventType, params, event) {
        this.eventHandler.dispatchEvent('timeAxis-' + eventType + this.uid, params, event);
    }

    // 注销注册的事件;
    // 注册分为多种情况, 
    //  1. 如果一个参数都没有传或者没有传递事件类型, 那么清除组件内注册的所有事件
    //  2. 如果传递了事件类型
    //      2.a: 如果传入了 eventDesc事件描述对象, 那么仅仅是取消描述对象中节点的点击行为, 此时参数 eventDesc应该包含一个 dataIndex属性来描述要取消的节点;
    //          2.a.x 如果还传递了回调函数, 那么清除当前类型中的回调;
    //      2.b: 如果没有传入 eventDesc事件描述对象
    //          2.b.1: 如果传递了回调函数, 那么仅仅从当前类型事件的队列中, 删除此回调
    //          2.b.2: 如果没有传递回调函数, 那么清除当前类型的所有事件
    off (eventType, eventDesc, cb) {
        if (cb === undefined && typeof eventDesc === 'function') {
            cb = eventDesc;
            eventDesc = null;
        }

        if (eventType) {
            if (eventDesc) {
                if (this.eventHelp[eventType] && this.eventHelp[eventType].dataIndex && eventDesc.dataIndex) {

                    for (var i=0, cur; i<this.eventHelp[eventType].dataIndex.length; i++) {
                        cur = this.eventHelp[eventType].dataIndex[i];
                        if (eventDesc.dataIndex.indexOf(cur) !== -1) {
                            this.eventHelp[eventType].dataIndex.splice(i, 1);
                        }
                    }
                } else {
                    this.eventHelp[eventType] = null;
                }
                if (cb) {
                    this.eventHandler.removeEvent('timeAxis-' + eventType + this.uid, cb);
                }
            } else {
                if (cb) {
                    this.eventHandler.removeEvent('timeAxis-' + eventType + this.uid, cb);
                } else {
                    this.eventHandler.disposeAll('timeAxis-' + eventType + this.uid);
                }
            }
            this.eventHelp[eventType + '_fire'] = false;
            this.eventHelp['addRegisterBlock'] = this.eventHelp['timetickClick_fire'] || this.eventHelp['timetickSelect_fire']
        } else {
            this.clearAllEvent();
        }
    }

    // 注册事件: 支持为某一个类型事件注册多个回调函数; 
    // {@param.eventType} 事件类型; 支持的事件类型有: timetickClick
    // {@param.eventDesc} 事件描述
    // {@param.cb} 要执行的回调;
    on (eventType, eventDesc, cb) {
        if (cb === undefined && typeof eventDesc === 'function') {
            cb = eventDesc;
            eventDesc = null;
        }
        this.eventHandler.addEvent('timeAxis-' + eventType + this.uid, eventDesc, cb);
        if (!this.eventHelp['addRegisterBlock'] && (eventType === 'timetickClick' || eventType === 'timetickSelect')) {
            this.addRegisterBlock(eventDesc);
        }

        this.eventHelp[eventType + '_fire'] = true;
        this.eventHelp['addRegisterBlock'] = this.eventHelp['timetickClick_fire'] || this.eventHelp['timetickSelect_fire']
        this.eventHelp[eventType] = eventDesc;
        eventType = 'timeAxis-' + eventType + this.uid;
        if (this.eventRecord.indexOf(eventType) !== -1) {
            this.eventRecord.push(eventType);
        }
    }

    clearAllEvent () {
        if (this.eventHandler) {
            for (var i = 0; i < this.eventRecord.length; i++ ) {
                this.eventHandler.disposeAll(this.eventRecord[i]);
            };

            this.removeRegisterBlock();
        }

        this.eventHelp = {};
    }

    destroy () {
        this.clearAllEvent();
        for (var key in this.animation) {
            if (this.animation[key]) {
                cancelAnimationFrame(this.animation[key]);
            }
        }
        for (var key in this) {
            delete this[key];
        }
    }
}


export default MultiTimeAxis;

export {
    MultiTimeAxis
}