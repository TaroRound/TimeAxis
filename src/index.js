import { getUUid, typeOf, deepEqual, deepCopy, formatDate, type, getDate, linear, merge_recursive, noevent, calcBreakWord, getSysFont } from './lib/util/index';
import Chart from './components/chart/index';
import TimeSeriesLine from './components/timeSeriesLine/index';
import DataZoom from './components/dataZoom/index';
import EventHandler from './lib/eventProxy/index'
import MultiTimeAxis from './components/multiTimeAxis/index';
import SearchSelect from './components/select/searchSelect';
import fillRect from './shape/rect';
import fillText from './shape/text';

/**
 * 配置项示例:
 * {
        mode: '2d',                 // 使用的 canvas 绘图对象 canvas.getContext(mode), 暂时只实现了 2d的上下文 
        direction: 'horizontal',    // 图形展现的方向: 横向 horizontal/纵向 vertical
        tooltip: {                  // 提示文字的设置
            show: false,            // 是否启用提升文字, 默认为 true
            trigger: 'item',        // 悬停框触发的方式, 绑定到刻度尺还是图例上 axis/item; 暂时只实现了图例 
            style: {                // 悬停框的样式设置, 支持的属性值共有 padding, background, fontSize, lineHeight, boxShadow, color, borderRadius, 其他的属性暂不予支持(过多的样式设置可能会破坏提升框的行为)
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '3px',
                color: '#eee'
            }
        },
        dataZoom: {                 // 缩放控件, 对数据进行缩放的控制, 在大数据量时这一个是很有必要的, 而且即使不展示缩放控件, 默认也会对数据进行切片处理
            show: false,
            start: 0,               // 控制数据的起止比例, 会对数据依据比例值进行截取, 默认为 0~100 
            end: 100,
            startIndex: 0,          // 对截取得到的数据进行再切片, 依据比例展示图形, 默认会从截取的数据中去计算得到; 出于性能考虑, 这里的起止点被强制控制在了一个安全的范围之内
            endValue: 10,
            height: 20,             // 滑块的高度
            margin: 1,              // dataZoom 组件和刻度尺组件共享一个区块(初步做成了这样), 这个变量用来控制两个组件之间的距离
            position,               // 缩放控件在共享区块中所处的位置: 当图例方向为横向时, 有效值为 top, middle, bottom(默认); 方向为纵向时, 有效值为 left center right(默认);
            outer: {                // 对外滑块的样式上的设置, 比如背景色, 描边
                background: 'to right:0% rgba(232,238,248,1): 30% rgba(232,238,248,0.4): 70% rgba(232,238,248,0.4): 100% rgba(232,238,248,1)',
            },              
            inner: {},              // 对内滑块的样式上的设置, 比如背景色, 描边
            boundaryText: {         // 对图例两端值的文本设置
                show: true,         // 是否展示端点的文本
                formatter: function (v) {   // 对两端显示文本的格式化处理
                    return formatDate(v, 'yyyy-MM-dd hh:mm:ss')
                },
                textStyle: {        // 两端文本样式上的设置, 如 字号, 颜色
                    color: '4c4c4c'
                }
            },
            resizerStyle: {         // 对滑块缩放块的设置: 缩放块的大小可能并不符合业务的要求, 默认大小: 宽 4像素, 高 height/2（滑块高度的一半）; 
                width: 6,           // 滑块块的宽度设置, 默认为 4
                color: '#ccc'       // 滑块块的颜色设置, 块与线条均取的同样颜色
            }
        },
        grid: {                     // 整体图例与 canvas 的边距, 仅支持具体的像素值, 不考虑支持百分比
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            containlabel: true      // 是否包含文本: --未支持的配置
        },
        axis: {                     // 刻度尺的设置
            show: true,             // 是否展示刻度尺
            insertIndex: 1,         // 刻度尺插入到图例的索引位置
            style: {}               // 刻度尺和 dataZoom组件共享区块的 宽度与高度的设置, 
        },

        fieldkey_from: 'from',          // 连接线起点读取的字段名
        fieldkey_to: 'to',              // 连接线终点读取的字段名
        fieldkey_nodeId: 'id',          // 节点唯一 id读取的字段名
        fieldkey_nodeText: 'text',      // 节点文本读取的字段名
        fieldkey_timestamp: 'start',    // 连接线时间节点读取的字段名, 如果这个读取的值是字符串形式的时间戳, 会被转换为统一的时间戳 14位的毫秒数, 如果为数字则不转换格式
        fieldkey_links: 'links',        // 连接线 links读取的字段名
        fieldkey_nodes: 'nodes',        // 节点 nodes读取的字段名
        series: [                   // 图例数据
            {   
                name: '好友聊天',   // 图例名称, 该名称将作为分组后的标识
                background: 'green',// 图例背景色
                groupId: '22',      // 图例所属的分组 id
                fieldkey_from: 'from',          // 功能同 全局的 fieldkey_from, 只是对单个图例的值读取设置
                fieldkey_to: 'to',              // 
                fieldkey_nodeId: 'id',          // 
                fieldkey_nodeText: 'text',      // 
                fieldkey_timestamp: 'start',    // 
                fieldkey_links: 'links',        // 
                fieldkey_nodes: 'nodes',        // 
                title: {                        // 图例标题区域功能的设置, 如果一个分组中包含多个图例, 标题区域功能会进行合并
                    titleText: {                // 标题文本的设置
                        show: boolean           // 默认为true
                        text: '图例标题',
                        color: '',
                        fontSie: 14,
                        align: ''
                    },
                    sort: {
                        show: boolean,
                        options: []
                    },
                    filter: {
                        show: boolean,
                        options: []
                    }
                },
                data: {             // 图例的数据
                    nodes: [],      // 节点
                    links: []       // 链接线
                }
            },
            {   
                index: 1,
                name: '话单', 
                background: '#f78989',
                data: {
                    nodes: [], 
                    links: []
                }
            },
            {   
                name: '群组', 
                background: '#d5d5d5',
                groupId: '11',
                data: {
                    nodes: [], 
                    links: []
                }
            },
            {   
                name: '短信', 
                background: '#f40',
                groupId: '11',
                data: {
                    nodes: [], 
                    links: []
                }
            },
            {   
                name: '彩信', 
                background: 'blue',
                groupId: '22',
                data: {
                    nodes: [], 
                    links: []
                }
            }
        ]
    }
    */

/**
 * 多源时间轴:
 * 
 * 1. 支持2D/3D 的切换: (后续版本实现)
 * 2. 支持图形/表格之间的切换
 * 3. 支持绘制任意数量的时间序列图形, 并对齐手动排序
 * 4. 支持多种布局方式: 横向/纵向, 
 * 5. 支持对多个图形, 执行合并到一个时间序列图形中;
 * 6. 多个图形之间, 支持关联变化, 可以对选中的图形关联变化, 如拖动, 缩放; 
 */
class TimeStaticChart extends Chart {
    constructor (
        selector,   // DOM 选择器
    { 
        mode,       // 图形绘制模式, 2D平铺图 or 3D立体图; 
        direction,  // 图形绘制方向, 从上到下, 或从左到右
        tooltip,    // 图形悬停提升
        dataZoom,   // 数据缩放相关配置:
        grid,       // 图形基本布局, 位置大小
        axis,       // 时间刻度尺
        series,      // 绘制的时间序列图, 图例配置和图例数据
        chartPadding,
        chartMargin,
        chartOffset,
        nodePadding,
        minCellWidth,
        splitLine,
        nodeSlider,
        leftPadding,
        topPadding,
        rightPadding,
        bottomPadding,
        tickRenderStart, // 设置一个默认的左间距
        fieldkey_timestamp,
        fieldkey_nodeId,
        fieldkey_nodeText,
        fieldkey_from,
        fieldkey_to,
        fieldkey_links,
        fieldkey_nodes,
        fieldkey_groupId,
        safePerformance,

    }) {
        super(selector, { mode, leftPadding, topPadding, rightPadding, bottomPadding, tooltip: tooltip });

        this.status = 0;
        this.direction = direction || 'horizontal';  // horizontal|vertical
        this.dataZoom = Object.assign({show: true}, dataZoom||{} );
        this.axis = Object.assign({ show: true, insertIndex: 0 }, axis || {});
        this.axisClone = Object.assign({}, this.axis);
        // 
        this.performance = {
            t1: Date.now() + ':创建时间:' 
        };
        this.layout = [];
        this.groupedData = null;
        this.dataZoomInstance = null;
        this.timeTickInstance = null;
        this.chartInstance = [];
        this.eventHandler = null;
        this.tickRenderStart = this.direction === 'horizontal' ? tickRenderStart || 140 : 60;
        //
        this.fieldkey_timestamp = fieldkey_timestamp || 'timestamp';
        this.fieldkey_nodeId = fieldkey_nodeId || 'nodeId';
        this.fieldkey_nodeText = fieldkey_nodeText || 'text';
        this.fieldkey_from = fieldkey_from || 'from';
        this.fieldkey_to = fieldkey_to || 'to';
        this.fieldkey_links = fieldkey_links || 'links';
        this.fieldkey_nodes = fieldkey_nodes || 'nodes';
        this.fieldkey_groupId = fieldkey_groupId || 'groupId';
        this.safePerformance = safePerformance;
        
        // 网格边距
        var {left, right, top, bottom, contentLabel} = grid || {};
        this.chartPadding = chartPadding;
        this.chartMargin = chartMargin;
        this.chartOffset = chartOffset;
        this.nodePadding = nodePadding;
        this.minCellWidth = minCellWidth;
        this.splitLine = splitLine;
        this.nodeSlider = nodeSlider;
        this.leftPadding = left !== undefined ? +left : 0;
        this.rightPadding = right !== undefined ? +right : 0;
        this.topPadding = top !== undefined ? +top : 0;
        this.bottomPadding = bottom !== undefined ? +bottom : 0;
        this.contentLabel = !!contentLabel;
        this.dragPercent = {};  // 操作滑动条/图形缩放 所记录 的百分比

        this.transfrom = {
            k: 1,
            lastK: 1,
            x: 0,
            y: 0
        }
        this.animation = {};
        this.eventHelp = {};
        this.defaultBackground = [
            'to bottom: 0% #75A4FF:100% #4258E5',   // 话单
            'to bottom: 0% #FFA22F:100% #F28600',   // 银行
            'to bottom: 0% #2AAE30:100% #1ABE52',   // 好友
            'to bottom: 0% #7648FF:100% #6748EE',   // 群组
            'to bottom: 0% #1BC9E1:100% #06A2C3',   // 短信
            'to bottom: 0% #1BC9E1:100% #F28600',   // 彩信
        ]

        // this.defaultOffset = { top: 10, bottom: 10, left: 10, right: 10 };
        // this.defaultBoundray = { left: 15, right: 15, top: 0, bottom: 0 };
        // this.defaultPadding = { top: 0, bottom: 0, left: 0, right: 0 };
    
        // console.log('绘制图例, 参数', dataZoom, series);
        if (series && series.length) {
            this.init(series);
        }
    }

    /**
     * 绘制步骤: (以下仅限于 2D模式的绘图, 3D模式的绘图暂未实现)
     * 1. 先调用 Chart类的 init方法, 绘制基本的 canvas
     * 2. 创建时间轴 标尺的绘制范围: 这一步同样会定义好绘制图形的范围: 为了超大数据集的情况下达到更快的性能
     * 3. 初始化时间轴布局信息: 定义各类型图的所占位置信息
     * 4. 调用图形构造方法, 绘制图形; 调用缩放组件构造方法, 绘制缩放组件; 调用时间标尺构造方法, 绘制时间标尺
     * 5. 对已绘制的图形进行关联: 
     *      包括: 为缩放组件缩放时: 重新调用时间轴标尺实例的更新方法, 重新调用非固定图形的更新方法
     *            为非固定图形挂载事件, 拖动位置到某一可合并图层时, 对两个图层进行合并
     *            鼠标悬停在标尺/图层时, 把图层/标尺都传递到回调函数, 以生成正确的提升信息
     */
    init (seriesData) {
        super.init();

        this.performance.t2 = Date.now();

        this.series = seriesData || [];

        this.performance.t3 = Date.now();

        this.eventHandler = new EventHandler('#' + this.domID);
        this.eventHandler.setTipsContent = this.setTipsContent.bind(this);
        this.eventHandler.hideTips = this.hideTips.bind(this);
        this.eventHandler.addEvent('mousewheel', this.scrollHandler)

        // 初始化多选框
        this.renderMulteSelect();
        this.performance.t4 = Date.now();

        this.setAxisHeight();
        this.performance.t5 = Date.now();

        // 设置缩放控件范围
        this.createDataZoom();
        this.performance.t6 = Date.now();
        this.performance.t7 = Date.now();

        if (this.series.length === 0) {
            this.status = 1;
            this.errorHandler({
                level: 'error',
                text: '无数据',
                background: '#f0f0f0'
            });
            return
        }

        // 初始化布局
        this.initLayout(this.series).then(resolve => {
            this.performance.t8 = Date.now() + ':计算布局, 标记时间点:';
            
            this.animation.renderDataZoom = requestAnimationFrame(()=>{
                    // 绘制缩放控件
                    try {
                        this.drawDataZoom();
                    } catch (e) {
                        console.log('初始化阶段, 绘制缩放控件出错', e);
                    }
                }, 16);

            this.animation.renderTimeTick = requestAnimationFrame(()=>{
                    // 绘制刻度尺控件
                    try {
                        this.drawTimeTicks();
                    } catch (e) {
                        console.log('初始化阶段, 绘制刻度尺', e);
                    }
                }, 16);

            this.performance.t9 = Date.now() + ':计算布局 所耗时间:' + (parseFloat(this.performance.t8) - parseFloat(this.performance.t7));
            
            // 依据计算好的布局信息, 在对应的区块内绘制图/轴
            try {
                this.drawCharts();
            } catch (e) {
                console.log('初始化阶段, 绘制图表出错', e);
            }
            
            this.performance.t10 = Date.now() + ':绘制图例, 标记时间点:';
            this.performance.t11 = Date.now() + ':总耗时:' + (parseFloat(this.performance.t10) - parseFloat(this.performance.t1)) + ', 开始异步绘制';
        }, reject => {
            console.log('O.O, 意外错误');
        });
        
    }

    // 上一次的比例值保持在 dragPercent 中, 以这个值作为缩放对象:
    scrollHandler = (e, canvas) => {
        this.transfrom.k += -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002);
        if (this.status === 0) {
            noevent(e);
            this.transfrom.k = this.transfrom.k <= 1 ? 1 : this.transfrom.k;
            if (this.animation.scrollHandler) { cancelAnimationFrame(this.animation.scrollHandler) };
            this.animation.scrollHandler = requestAnimationFrame(()=>{
                var _dragPercent = this.dragPercent;
                var _dataZoom = this.dataZoom;
                var scaleK = this.transfrom.k;
                var newPercent = {
                    startValue: _dragPercent.startValue == undefined ? _dataZoom.startValue : _dragPercent.startValue,
                    endValue: _dragPercent.endValue == undefined ? _dataZoom.endValue : _dragPercent.endValue
                }

                var halfValue = (newPercent.endValue - newPercent.startValue) / 2;
                var mixValue = newPercent.startValue + halfValue;

                var speed = (1 - 1 / scaleK) * 1.03;
                var lastK = this.transfrom.lastK;

                newPercent.startValue += halfValue * speed;
                newPercent.endValue -= halfValue * speed;

                if (newPercent.startValue >= mixValue) {
                    newPercent.startValue = mixValue;
                } else if (newPercent.startValue <= 0) {
                    newPercent.startValue = 0;
                }
                if (newPercent.endValue <= mixValue) {
                    newPercent.endValue = mixValue;
                } else if (newPercent.endValue >= 100){
                    newPercent.endValue = 100;
                }
                // console.log('缩放系数', scaleK, _dragPercent);
                if (this.dataZoom.resizeToMaxAble === false || this.dataZoom.resizeable === false || this.dataZoom.resizeToMinAble === false) {
                    // newPercent.startValue = 
                    if (newPercent.endValue - newPercent.startValue >= _dataZoom.endValue - _dataZoom.startValue) {
                        this.transfrom.k = 1;
                        this.transfrom.lastK = 1;
                        // newPercent.endValue = newPercent.startValue + (_dataZoom.endValue - _dataZoom.startValue);
                        return
                    }
                }
                this.transfrom.lastK = scaleK;
                // 更新图例
                this.chartInstance && this.chartInstance.map((chart,index) => {
                    chart.update({
                        startPercent: newPercent.startValue,
                        endPercent: newPercent.endValue
                    });
                });

                // 更新刻度尺
                this.drawTimeTicks({
                    startValue: newPercent.startValue,
                    endValue: newPercent.endValue
                });

                // 更新缩放控件
                this.dataZoomInstance && this.dataZoomInstance.update({
                    startValue: newPercent.startValue,
                    endValue: newPercent.endValue
                });
            }, 16);
        }
    }

    // 初始化布局: 布局方式: 横向/纵向
    // 图形要素: 
    // 标题部分: 图形固定 + 图标题 + 内容过滤筛选器
    // 图形部分: 横轴 + 纵轴 + 网格
    initLayout (data) {
        return new Promise((resolve, reject) => {
            try {
                var canvasWidth = this.width;
                var canvasHeight = this.height;
                var {leftPadding, topPadding, rightPadding, bottomPadding, fieldkey_groupId} = this;
                var {margin} = this.getDefaultMargin();
                
                // 对待绘制的任务进行分组, 部分图形可能需要一开始就合并在一起;
                var groupedData = {groupKeys: []};
                for(var i = 0; i < data.length; i++) {
                    fieldkey_groupId = data[i].fieldkey_groupId || fieldkey_groupId;

                    if (data[i][fieldkey_groupId]) {
                        groupedData[data[i][fieldkey_groupId]] = groupedData[data[i][fieldkey_groupId]] || [];

                        groupedData[data[i][fieldkey_groupId]].push(data[i]);
                        if(groupedData.groupKeys.indexOf(data[i][fieldkey_groupId]) === -1) {
                            groupedData.groupKeys.push(data[i][fieldkey_groupId]);
                        }
                    } else {
                        groupedData[i] = groupedData[i] || [];
                        groupedData[i].push(data[i]);
                        if(groupedData.groupKeys.indexOf(i) === -1) {
                            groupedData.groupKeys.push(i);
                        }
                    }
                }
                // 每一个合并在一起的图层组, 也有图层顺序, 这里依据声明的 index进行排序, 绘制时依据图层顺序, 叠加绘制;
                for(var i=0; i<groupedData.groupKeys.length;i++) {
                    groupedData[groupedData.groupKeys[i]].sort((n1, n2) => {
                        var i1 = n1.zIndex || 0;
                        var i2 = n2.zIndex || 0;
                        return i1 > i2 ? -1 : 1;
                    })
                };

                var dataLen = groupedData.groupKeys.length;
                var axisMargin = this.axis && this.axis.margin || {};
                var everyChartWidth;
                var everyChartHeight;
                var stackMargin = {};
                // 存储 图和轴 的位置信息;
                var steps = [];

                // 横向布局
                if (this.direction === 'horizontal') {
                    
                    if (this.axis) {
                        everyChartHeight = (canvasHeight - topPadding - bottomPadding - this.axis.height - (margin.top || 0) * dataLen - (margin.bottom || 0) * dataLen) / dataLen;
                    } else {
                        everyChartHeight = (canvasHeight - topPadding - bottomPadding - (margin.top || 0) * dataLen - (margin.bottom || 0) * dataLen) / dataLen;
                    }
                    everyChartWidth = canvasWidth - leftPadding - rightPadding;
                    
                    let ty = 0;
                    var insertIndex = this.axis && this.axis.insertIndex !== undefined ? +this.axis.insertIndex || 0 : undefined;
                    for (var i=0; i<dataLen; i++) {
                        var notRightId = groupedData[groupedData.groupKeys[i]][0].name;
                        stackMargin.top = (margin.top || 0) * i;
                        stackMargin.bottom = (margin.bottom || 0) * i;
                        steps.push({
                            x: Math.round(leftPadding),
                            y: Math.round(topPadding + ty + stackMargin.top + (i == 0 ? 0 : stackMargin.bottom)),
                            width: Math.round(everyChartWidth),
                            height: Math.round(everyChartHeight),
                            type: 'chart',
                            groupId: groupedData.groupKeys[i],
                            name: notRightId
                        });
                        ty+=everyChartHeight;

                        // if (this.axis) {
                        //     this.axis.insertIndex = this.axis.insertIndex !== undefined ? +this.axis.insertIndex : 0;
                            if (insertIndex === i) {
                                // stackMargin.top = stackMargin.top - (margin.top || 0);
                                // stackMargin.bottom = stackMargin.bottom - (margin.bottom || 0);
                                steps.push({
                                    x: Math.round(leftPadding),
                                    y: Math.round(topPadding + ty + stackMargin.top + stackMargin.bottom),
                                    width: this.axis.width,
                                    height: this.axis.height,
                                    type: 'axis',
                                    name: notRightId || 'axis'
                                });
                                ty+=this.axis.height;
                            }
                        // };
                    }
                }
                // 纵向布局 
                else {
                    if (this.axis) {
                        everyChartWidth = (canvasWidth - leftPadding - rightPadding - this.axis.width - (margin.left || 0) * dataLen - (margin.right || 0) * dataLen) / dataLen;
                    } else {
                        everyChartWidth = (canvasWidth - leftPadding - rightPadding - (margin.left || 0) * dataLen - (margin.right || 0) * dataLen) / dataLen;
                    }
                    everyChartHeight = canvasHeight - topPadding - bottomPadding;
                    
                    let tx = 0;
                    for (var i=0; i<dataLen; i++) {
                        var notRightId = groupedData[groupedData.groupKeys[i]][0].name;
                        
                        steps.push({
                            x: Math.round(leftPadding + tx + (margin.top || 0) * i + (margin.bottom || 0) * i),
                            y: topPadding,
                            width: Math.round(everyChartWidth),
                            height: Math.round(everyChartHeight),
                            type: 'chart',
                            groupId: groupedData.groupKeys[i],
                            name: notRightId
                        });
                        tx+=everyChartWidth;

                        if (this.axis) {
                            this.axis.insertIndex = this.axis.insertIndex !== undefined ? +this.axis.insertIndex : 0;
                            
                            if (this.axis.insertIndex === i) {
                                steps.push({
                                    x: Math.round(leftPadding + tx + (margin.top || 0) * i + (margin.bottom || 0) * i),
                                    y: topPadding,
                                    width: this.axis.width,
                                    height: this.axis.height,
                                    type: 'axis',
                                    name: notRightId || 'axis'
                                });
                                tx+=this.axis.width;
                            }
                        }
                    }
                }
                
                // console.log('初始化位置布局信息', everyChartWidth, everyChartHeight,steps, groupedData);
                this.layout = steps;
                this.groupedData = groupedData;

                resolve();
            } catch (e) {
                console.warn('初始化布局时出现了错误, 错误信息', e);
                reject();
            }
        });
    }
    
    getDefaultMargin () {
        var titleHeight, offset, boundary, padding, tickRenderStart, minCellWidth, margin, nodePadding;

        if (this.direction === 'horizontal') {
            titleHeight = this.titleHeight || 40;
            offset = this.chartOffset || { top: 10, bottom: 10, left: 10, right: 0 };
            boundary = this.chartBoundary || { left: 15, right: 15, top: 0, bottom: 0 };
            padding = this.chartPadding || { top: 0, bottom: 0, left: 0, right: 0 };
            margin = this.chartMargin || { top: 0, bottom: 0, left: 0, right: 0 };
            nodePadding = this.nodePadding || null;
            tickRenderStart = this.tickRenderStart || 140;
            minCellWidth = this.minCellWidth || 0;
        } else {
            titleHeight = this.titleHeight || 40;
            offset = this.chartOffset || { top: 0, bottom: 10, left: 10, right: 0 };
            boundary = this.chartBoundary || { top: 15, bottom: 15, left: 0, right: 0 };
            padding = this.chartPadding || { top: 0, bottom: 0, left: 0, right: 0 };
            margin = this.chartMargin || { top: 0, bottom: 0, left: 0, right: 0 };
            nodePadding = this.nodePadding || null;
            tickRenderStart = this.tickRenderStart || 60;
            minCellWidth = this.minCellWidth || 0;
        }

        return {
            titleHeight, offset, boundary, padding, tickRenderStart, minCellWidth, margin, nodePadding
        }
    }

    setAxisHeight (isReyout) {
        if (this.axis) {
            // var {width, height} = this.axis;
            var {width, height} = this.axisClone;
            if (this.direction === 'horizontal') {
                // this.axis.width = isReyout ? this.width - this.leftPadding - this.rightPadding : width || (this.width - this.leftPadding - this.rightPadding);
                // this.axis.height = isReyout ? 80 : height || 80;
                this.axis.height = height || 80;
                this.axis.width = isReyout ? this.width - this.leftPadding - this.rightPadding : width || (this.width - this.leftPadding - this.rightPadding);
            } else {
                // this.axis.width = isReyout ? 100 : width || 100;
                // this.axis.height = isReyout ? this.height - this.topPadding - this.bottomPadding : height || (this.height - this.topPadding - this.bottomPadding);
                this.axis.width = width || 100;
                this.axis.height = isReyout ? this.height - this.topPadding - this.bottomPadding : height || (this.height - this.topPadding - this.bottomPadding);
            }
        }
    }

    // 刻度尺的位置和滑动条的位置邻近: 
    drawTimeTicks (config) {
        var TimeAxisAndZoomLayout = this.layout.filter(v => {
            return v.type === 'axis';
        })[0];

        if (TimeAxisAndZoomLayout) {
            var {position, min, max, timeunit, startValue, endValue} = Object.assign({}, this.dataZoom, config);
            var sliderHeight = this.dataZoom.height || 20;
            var margin = this.dataZoom.margin || 0;
            var boxModer = { x: 0, y: 0, width: 0, height: 0 };

            // 横向
            if (this.direction === 'horizontal') {
                switch (position) {
                    case 'top':
                        boxModer.y = TimeAxisAndZoomLayout.y + sliderHeight + margin;
                        break;
                    // case 'middle':
                        // boxModer.y = TimeAxisAndZoomLayout.y + TimeAxisAndZoomLayout.height - 10;
                        break;
                    case 'bottom':
                        boxModer.y = TimeAxisAndZoomLayout.y;
                        break;
                    default:
                        boxModer.y = TimeAxisAndZoomLayout.y;
                        break;
                }
                boxModer.x = TimeAxisAndZoomLayout.x;
                boxModer.width = TimeAxisAndZoomLayout.width;
                boxModer.height = TimeAxisAndZoomLayout.height - sliderHeight - margin;
            } else {
                switch (position) {
                    case 'left':
                        boxModer.x = TimeAxisAndZoomLayout.x + sliderHeight + margin;
                        break;
                    // case 'center':
                    //     boxModer.x = TimeAxisAndZoomLayout.x + (TimeAxisAndZoomLayout.width - sliderHeight)/2;
                    //     break;
                    case 'right':
                        boxModer.x = TimeAxisAndZoomLayout.x;
                        break;
                    default: 
                        boxModer.x = TimeAxisAndZoomLayout.x;
                        break;
                }
                boxModer.y = TimeAxisAndZoomLayout.y;
                boxModer.width = TimeAxisAndZoomLayout.width - sliderHeight - margin;
                boxModer.height = TimeAxisAndZoomLayout.height;
            }

            var {boundary, offset, tickRenderStart, titleHeight} = this.getDefaultMargin();     
            var leftPadding = this.direction === 'horizontal' ? tickRenderStart + offset.left : tickRenderStart + titleHeight + offset.top;
            var rightPadding = this.direction === 'horizontal' ? offset.right : offset.bottom;
            var scaleK = linear([0, 100], [min, max]);
            var setting = {
                direction: this.direction,
                x: boxModer.x,
                y: boxModer.y,
                width: boxModer.width,
                height: boxModer.height,
                boundary: this.direction === 'horizontal' ? [boundary.left, boundary.right] : [boundary.top, boundary.bottom],
                leftPadding,
                rightPadding,
                background: this.axis.background,
                backgroundOrigin: this.axis.backgroundOrigin,
                timeunit: timeunit,
                min: scaleK.setX(startValue),
                max: scaleK.setX(endValue),
                interval: 8,
                text: this.axis.text
            };
            if (this.timeTickInstance) {
                this.timeTickInstance.update(setting);
            } else {
                this.timeTickInstance = new MultiTimeAxis(this.context, setting, this.eventHandler, this.canvas);
                if (this.eventHelp['timetickClick_fire']) {
                    this.timeTickInstance.on(
                        'timetickClick', 
                        Object.assign({eventType: 'timetickClick'}, this.eventHelp['timetickClick']), 
                        this.broadcastUpEvent
                    ); // dataIndex: [1, '1980']
                }
            }
        }
    }

    drawCharts () {
        var {startValue, endValue, min, max} = this.dataZoom;
        var {fieldkey_links, fieldkey_nodes, fieldkey_from, fieldkey_to, fieldkey_nodeId, fieldkey_timestamp, fieldkey_nodeText} = this;
        // 'to right: 0 rgba(0,0,0,0.5): 0.5 #ccc: 1 #f0f0f0' || 
        this.chartInstance = [];
        this.layout.forEach((layout,i) => {
 
            // requestAnimationFrame(()=>{
                var axisIndex = this.layout.findIndex(layout => { return layout.type === 'axis' });
                if (layout.type === 'chart') {

                    var series = this.groupedData[layout.groupId];
                    var defaultColor = i < axisIndex ? this.defaultBackground[i - 1] : this.defaultBackground[i];
                    var color = defaultColor;
                    var splitLineStyle = this.splitLine;
                    var nodeSlider = this.nodeSlider;
                    var {offset, padding, boundary, titleHeight, tickRenderStart, minCellWidth, nodePadding} = this.getDefaultMargin();
                    var nodeTextStyle = nodePadding ? {padding: nodePadding} : null;
                    var chartBackground,
                        fieldKey_nodeSourcetype,
                        first, 
                        itemStyle;
                    if (first = series && series[0]) {
                        color = first.background || defaultColor;
                        splitLineStyle = first.splitLine || this.splitLine;
                        nodeSlider = first.nodeSlider || this.nodeSlider;
                        padding = first.padding || padding;
                        chartBackground = first.chartBackground;
                        fieldKey_nodeSourcetype = first.fieldKey_nodeSourcetype;
                        nodeTextStyle = Object.assign({}, nodeTextStyle, first.nodeTextStyle); // first.nodeTextStyle || nodeTextStyle
                        itemStyle = first.itemStyle;
                    }

                    var setting = Object.assign({}, layout, { 
                        direction: this.direction,
                        offset: offset,
                        boundary: boundary,
                        padding: padding,
                        minCellWidth: minCellWidth,
                        // smooth: true,
                        background: color,
                        chartBackground: chartBackground,
                        splitLine: merge_recursive({
                            dash: [3, 2],
                            color: 'rgba(255,255,255,0.2)',
                            lineWidth: 1
                        }, splitLineStyle),
                        nodeTextStyle: nodeTextStyle,
                        startPercent: startValue,
                        endPercent: endValue,
                        saferange: endValue - startValue,
                        min: min,
                        max: max,
                        reverse: axisIndex === -1 ? false : i < axisIndex,   // 绘图顺序: 从上到下, 从左到右;
                        chartId: layout.groupId,
                        maxAxisTextWidthOrHeight: tickRenderStart,
                        titleHeight: titleHeight,
                        fieldkey_links,
                        fieldkey_nodes,
                        fieldkey_from,
                        fieldkey_to,
                        fieldkey_nodeId,
                        fieldkey_timestamp,
                        fieldkey_nodeText,
                        fieldkey_sourcetype: fieldKey_nodeSourcetype,
                        tooltip: this.tooltip,
                        nodeSlider: nodeSlider,
                        itemStyle: itemStyle
                    });
                    var newTimeLines = new TimeSeriesLine(this.context, setting, series, this.eventHandler, this.canvas);

                    var fireEvents = ['legendChange', 'itemClick', 'itemHover', 'nodeClick', 'nodeContextMenu', 'nodeDrag'];
                    fireEvents.forEach(eventType => {
                        if (this.eventHelp[eventType + '_fire']) {
                            // 
                            newTimeLines.on(eventType, {eventType, ...this.eventHelp[eventType]}, this.broadcastUpEvent);
                        }
                    });
                    // newTimeLines.on('legendChange', {seriesIndex: i, eventType: 'legendChange'}, this.broadcastUpEvent);
                    this.chartInstance.push(newTimeLines);
                }
            // }, 0);
        })
    }

    // 更新所有的序列图实例
    updateChart (opt) {
        this.chartInstance && this.chartInstance.map(chart => {
            var fieldkey_groupId = chart.fieldkey_groupId || this.fieldkey_groupId;

            ((chartId, fieldkey_groupId)=>{
                let storeChartId = chartId;
                if (this.animation['chartInstance_' + storeChartId] ) { cancelAnimationFrame(this.animation['chartInstance_' + storeChartId]) }
                this.animation['chartInstance_' + storeChartId] = requestAnimationFrame(()=>{
                                                                    var layout = this.layout.filter(layout => { return layout.groupId == storeChartId });
                                                                    if (layout) {
                                                                        chart.update({
                                                                            ...layout[0],
                                                                            ...opt
                                                                        });
                                                                    }
                                                                }, 15);
            })(chart.uid, fieldkey_groupId);
        });
    }

    // 寻找数据极值, 设置正确的显示区间
    createDataZoom () {
        var t1 = Date.now();
        var _min;
        var _max;
        // 时间范围这是必要的, 尤其是小刻度下, 必须得对数据进行切片处理; 以尽快渲染;
        var {
            show,   // 是否展示缩放控件
            start,  // 截取的时间范围
            end,    // 截取的时间范围
            startValue, // 绘制的时间范围
            endValue,   // 绘制的时间范围
            timeunit    // 绘制的时间刻度
        } = this.dataZoom;

        var totalMaxCount = 0;      // 单个图例 最大数据条数
        var safeMaxCount = this.safePerformance || 100;     // 图例要展示的大概数量
        var fieldkey_links = this.fieldkey_links;
        var fieldkey_timestamp = this.fieldkey_timestamp;
        var dataView = [];
        var ct1 = Date.now();
        this.series && this.series.forEach(chart => {
            fieldkey_links = chart.fieldkey_links || fieldkey_links;
            fieldkey_timestamp = chart.fieldkey_timestamp || fieldkey_timestamp;

            var data = [];
            try {
                data = chart.data[fieldkey_links] || [];
            } catch(e) {};

            if (data[0] && data[0][fieldkey_timestamp] === Number(data[0][fieldkey_timestamp])) {
                // 剃掉数据为负数的情况, 测试发现存在负数的错误数据
                data.forEach(link => {
                    var cv = link[fieldkey_timestamp];
                    _min = _min < cv ? _min : cv > 0 ? cv : 0;
                    _max = _max > cv ? _max : cv;
                    dataView.push(cv);
                });
            } else {
                // 剃掉数据为负数的情况, 测试发现存在负数的错误数据
                data.forEach(link => {
                    var cv = link[fieldkey_timestamp];
                    _min = _min < cv ? _min : cv;
                    _max = _max > cv ? _max : cv;
                    dataView.push(cv);
                });
            }
            totalMaxCount = data.length > totalMaxCount ? data.length : totalMaxCount;
        });

        // 在超大数据量时候, 为了避免要生成大量的 Date对象, 只在值为字符串时, 才做出时间转换: 因为要生成线性比例尺, 字符串无法生成
        if (typeOf(_max) === 'string') {
            _min = new Date(_min).getTime();
            _max = new Date(_max).getTime();
        } else if (typeOf(_max) === 'number') {
            // 为了兼容到 2019, 秒计数, 毫秒计数 等这些不定规格的数字格式, 且考虑到大量数据时的情况, 放弃转化为统一的 毫秒计数
        }
        start = start || 0;
        end = end || 100;
        startValue = startValue || 0;
        endValue = endValue || 100;
        // timeunit = timeunit || 'year';

        // 如果传入了 start, end, 那么认定为对数据进行截取: 这对于超大数据集时(比如千万级的一个队列), 可以作一个大的切片进行优化
        var k = (_max - _min) / 100;
        if (0 < start && start < 100) {
            _min = _min + start * k;
        }
        if (0 < end && end < 100) {
            _max = _min + end * k; // min + 100k = max; => min + end*k = max;
        }
        k = (_max - _min) / 100;

        if (totalMaxCount > safeMaxCount) {
            var _ev = safeMaxCount / totalMaxCount * 100;

            endValue = startValue > _ev ? startValue : _ev;
            startValue = startValue > _ev ? _ev : startValue;

            // 限定最大切片范围, 只可移动不可再缩小;
            this.dataZoom.resizeToMaxAble = false;    
        }

        this.dataZoom.startValue = startValue;
        this.dataZoom.endValue = endValue;
        // this.dataZoom.resizeToMaxAble = false;
        this.dataZoom.max = _max;
        this.dataZoom.min = _min;
        this.dataZoom.totalMaxCount = totalMaxCount;
        this.dataZoom.dataViewData = dataView;
        // 同时为操作值初始化
        this.dragPercent.startValue = startValue;
        this.dragPercent.endValue = endValue;
    };

    // 绘制滑块, 并添加滑块值改变事件;
    drawDataZoom () {
        var boundary = this.layout.filter(v => {
            return v.type === 'axis';
        })[0];

        if (boundary && this.dataZoom.show) {
            var userDataZoomHistory = this.dragPercent;
            var position = this.dataZoom.position;
            var sliderHeight = this.dataZoom.height || 20;
            var boxModer = { x: 0, y: 0, width: 0, height: 0, border: 'none' };

            // 横向
            if (this.direction === 'horizontal') {
                switch (position) {
                    case 'top':
                        boxModer.y = Math.round(boundary.y);
                        break;
                    // case 'middle':
                        // boxModer.y = boundary.y + (boundary.height - sliderHeight)/2;
                        break;
                    case 'bottom':
                        boxModer.y = Math.round(boundary.y + (boundary.height - sliderHeight));
                        break;
                    default:
                        boxModer.y = Math.round(boundary.y + (boundary.height - sliderHeight));
                        break;
                }
                boxModer.x = Math.round(boundary.x);
                boxModer.width = Math.round(boundary.width);
                boxModer.height = sliderHeight;
            } else {
                switch (position) {
                    case 'left':
                        boxModer.x = Math.round(boundary.x);
                        break;
                    // case 'center':
                    //     boxModer.x = boundary.x + (boundary.width - sliderHeight)/2;
                        break;
                    case 'right':
                        boxModer.x = Math.round(boundary.x + (boundary.width - sliderHeight));
                        break;
                    default: 
                        boxModer.x = Math.round(boundary.x + (boundary.width - sliderHeight));
                        break;
                }
                boxModer.y = Math.round(boundary.y);
                boxModer.width = Math.round(sliderHeight);
                boxModer.height = boundary.height;
            }

            var {offset, padding, boundary, titleHeight, tickRenderStart, minCellWidth} = this.getDefaultMargin();
            var outerBackground = 'to right:0% rgba(232,238,248,1): 30% rgba(232,238,248,0.4): 70% rgba(232,238,248,0.4): 100% rgba(232,238,248,1)';
            var innerBackground = '#409EFF';
            var outerSetting = this.dataZoom.outer;
            var innerSetting = this.dataZoom.inner;
            var boundaryText = this.dataZoom.boundaryText;
            var resizerStyle = this.dataZoom.resizerStyle;
            var dataView = this.dataZoom.dataView;
            var sliderPos = this.nodeSlider && this.nodeSlider.position;
            var nodeSliderHeight = this.nodeSlider && this.nodeSlider.sliderHeight || 10;
            var hasSlider = this.nodeSlider && !!this.nodeSlider.show;
            if (!hasSlider) {
                hasSlider = minCellWidth > 0;
                if (hasSlider) {
                    nodeSliderHeight = 15;
                }
            }
            if (outerSetting) {
                if (outerSetting.background) {
                    outerBackground = outerSetting.background
                }
            }
            if (innerSetting) {
                if (innerSetting.background) {
                    innerBackground = innerSetting.background;
                }
            }
            var leftPadding = 0;
            var rightPadding = 0;

            if (this.direction === 'horizontal') {
                leftPadding = padding.left + tickRenderStart + offset.left + (hasSlider && sliderPos !== 'end' ? nodeSliderHeight : 0 );
                rightPadding = offset.right + (hasSlider && sliderPos === 'end' ? nodeSliderHeight : 0 ) + padding.right;
            } else {
                leftPadding = padding.top + tickRenderStart + titleHeight + offset.top + (hasSlider && sliderPos !== 'end' ? nodeSliderHeight : 0 );
                rightPadding = offset.bottom + (hasSlider && sliderPos === 'end' ? nodeSliderHeight : 0 ) + padding.bottom;
            }
            // 
            var option = {
                ...boxModer,
                ...this.dataZoom,
                dataView,
                selectStartPercent: userDataZoomHistory.startValue == undefined ? this.dataZoom.startValue : userDataZoomHistory.startValue,
                selectEndPercent: userDataZoomHistory.endValue == undefined ? this.dataZoom.endValue : userDataZoomHistory.endValue,
                direction: this.direction,
                sliderHeight: sliderHeight,
                position: this.direction === 'horizontal' ? position || 'middle' : position || 'center',
                leftPadding: leftPadding,//60 => this.tickRenderStart
                rightPadding: rightPadding,
                outer: {
                    background: outerBackground, // 'to right:0% rgba(232,238,248,1): 30% rgba(232,238,248,0.4): 70% rgba(232,238,248,0.4): 100% rgba(232,238,248,1)',
                    stroke: outerSetting && outerSetting.stroke || null // '#DDDDDD'
                },
                inner: {
                    background: innerBackground
                },
                resizerStyle: Object.assign({
                    width: 4,
                    color: '#4c4c4c'
                }, resizerStyle),
                boundaryText: Object.assign({
                    show: true,
                    textStyle: {
                        color: '4c4c4c'
                    }
                }, boundaryText)
            }

            if (this.dataZoomInstance) {
                this.dataZoomInstance.update(option);
            } else {
                this.dataZoomInstance = new DataZoom(this.context, option, this.eventHandler, this.canvas);
                this.dataZoomInstance.init();

                this.dataZoomInstance.on('resize', {eventType: 'datazoom-resize'}, this.updateChartInstance);
                this.dataZoomInstance.on('moving', {eventType: 'datazoom-moving'}, this.updateChartInstance);
                this.dataZoomInstance.on('select', {eventType: 'datazoom-select'}, this.updateChartInstance);
            }
        }
    }

    // 滑块值改变事件的回调;
    updateChartInstance = (eventDesc, param) => {
        if (this.animation.updateAllChartLines) { 
            cancelAnimationFrame(this.animation.updateAllChartLines);
        }

        this.animation.updateAllChartLines = requestAnimationFrame(()=>{
            var {percent, value} = param;
            this.transfrom.k = 1;
            this.transfrom.lastK = 1;

            // 更新图例
            this.chartInstance && this.chartInstance.map((chart,index) => {
                chart.update({
                    startPercent: percent[0],
                    endPercent: percent[1]
                });
            });

            // 更新刻度尺
            this.drawTimeTicks({
                startValue: percent[0],
                endValue: percent[1]
            });

            // 因为 startValue/endValue 会在重绘拖动控件时用到, 所以可能会意外导致拖动控件不可放大/缩小, 所以额外保持了一组变量 用来记录用户操作时缩放的范围; 
            // this.dataZoom.startValue = percent[0];
            // this.dataZoom.endValue = percent[1];
            this.dragPercent.startValue = percent[0];
            this.dragPercent.endValue = percent[1];

            // this.timeTickInstance.off('timetickClick', {eventType: 'timetickClick', dataIndex: [1]}, this.broadcastUpEvent); // dataIndex: [1, '1980']
        }, 15);
    }


    // 销毁
    destroy () {
        // 清除事件的挂载
        this.eventHandler.disposeAll();
        
        // 实例的清除
        // 图例
        this.chartInstance && this.chartInstance.map(chart => {
            typeof chart.destroy === 'function' && chart.destroy();
        });
        // 缩放组件
        this.dataZoomInstance && typeof this.dataZoomInstance.destroy === 'function' && this.dataZoomInstance.destroy();
        // 时间刻度尺
        this.timeTickInstance && typeof this.timeTickInstance.destroy === 'function' && this.timeTickInstance.destroy();
        
        for (var key in this) {
            if (this.hasOwnproperty(key)) {
                delete this[key]
            }
        };

        typeof super.destory === 'function' && super.destory();
    }
    
    // 合并实例属性
    mergeOptions (setOptions, safeChangeAttrs) {
        var safeAttrs = safeChangeAttrs.split(',');
        var mergeOptions = {};
        if (setOptions) {
            safeAttrs.forEach(attr => {
                if (!setOptions.hasOwnProperty(attr)) {
                    return
                }
                switch (attr) {
                    // 这里必须添加控制, 否则很容易因为传入预期之外的值导致错误;
                    // 例如: 原先是 [65.5, 75.5] 的起止点,: （差值 10）, 那么传入新值时可以这样:
                    // {startValue: 40} => {startValue: 40, endValue: 50}
                    // {endValue: 70} => {startValue: 60, endValue: 70}
                    // {startValue: undefined, endValue: 50} => {startValue: 40, endValue: 50}
                    // {startValue: -14} => {startVlue: 0, endValue: 10}
                    // {startValue: 95, endValue: 130} => {startValue: 95, endValue: 100}
                    // {startValue: 130, endValue: 95} => {startValue: 85, endValue: 95}
                    // 以上是不可放大时的控制条件, 必须限定住起止的差值在原先的范围之内; 否则可能会因为放开的区域导致筛选出的数据量过大, 导致卡顿甚至崩溃
                    case 'dragPercent':
                        var newPercent = Object.assign({}, setOptions[attr]); // , 
                        
                        var oldStartValue = this.dragPercent.startValue == undefined ? this.dataZoom.startValue : this.dragPercent.startValue;
                        var oldEndValue = this.dragPercent.endValue == undefined ? this.dataZoom.endValue : this.dragPercent.endValue;
                        var oldDistance = oldEndValue - oldStartValue;

                        if (newPercent.startValue == undefined && newPercent.endValue == undefined) {
                            newPercent.startValue = oldStartValue;
                            newPercent.endValue = oldEndValue;
                        } else {
                            if (newPercent.endValue != undefined) {
                                if (newPercent.endValue > 100) {    // 小于 0
                                    newPercent.endValue = 100;
                                } else if (newPercent.endValue < 0) {
                                    newPercent.endValue = 0;
                                }
                            }

                            if (newPercent.startValue != undefined) {
                                if (newPercent.startValue < 0) {    // 大于 100
                                    newPercent.startValue = 0;
                                } else if  (newPercent.startValue > 100) {
                                    newPercent.startValue = 100;
                                }
                            }

                            newPercent.startValue = newPercent.startValue == undefined ? oldStartValue : newPercent.startValue;
                            newPercent.endValue = newPercent.endValue == undefined ? oldEndValue : newPercent.endValue ;
                        }
                        
                        // 如果是不可缩放（不可放大, 不可缩小, 不可缩放）的情况下, 不允许扩大选择范围
                        if (this.dataZoom.resizeToMaxAble === false || this.dataZoom.resizeable === false || this.dataZoom.resizeToMinAble === false) {
                            // console.log('对调并重设置', setOptions[attr].endValue);
                            // 如果只传递一个终点值, 那么认定为把时间段定位至末位, 往前推移原先的选择范围
                            if (setOptions[attr].endValue && !setOptions[attr].startValue) {
                                // 重调整位置并且保留住原先的选择区域;
                                if (Math.abs(newPercent.endValue - newPercent.startValue) > oldDistance) {
                                    newPercent.startValue = newPercent.endValue - oldDistance;
                                }
                            }
                            // 否则, 认定为把时间段定位至起点 
                            else {
                                if (Math.abs(newPercent.endValue - newPercent.startValue) > oldDistance) {
                                    newPercent.endValue = newPercent.startValue + oldDistance;
                                }
                            }
                        }

                        if (newPercent.startValue < 0) {
                            newPercent.startValue = 0;
                        }
                        if (newPercent.endValue > 100) {
                            newPercent.endValue = 100;
                        }
                        var cv = newPercent.endPercent;
                        newPercent.endValue = newPercent.startValue > newPercent.endValue ? newPercent.startValue : newPercent.endValue;
                        newPercent.startValue = newPercent.startValue > cv ? cv : newPercent.startValue;
                        
                        mergeOptions[attr] = newPercent;
                        break;
                    case 'width':
                    case 'height':
                        this.canvas[attr] = setOptions[attr];
                        mergeOptions[attr] = setOptions[attr];
                        break;
                    case 'axis':
                        mergeOptions[attr] = setOptions[attr];
                        mergeOptions[attr + 'Clone'] = setOptions[attr];
                        break;
                    default:
                        if (setOptions.hasOwnProperty(attr)) {
                            mergeOptions[attr] = setOptions[attr];
                        }
                        break;
                }
            });
        }

        merge_recursive(this, mergeOptions);
    }

    // 筛选数据集后重绘, 或是直接更新数据;
    // {@param.series} 新数据
    // {@param.setOptions} 要更改的配置项 
    update (series, setOptions) {
        // 数据更新, 重设置所有组件
        if (series) {
            var safeChangeAttrs = 'width,height,safePerformance,direction,tooltip,axis,grid,dragPercent,tickRenderStart,fieldkey_timestamp,fieldkey_nodeId,fieldkey_nodeText,fieldkey_from,fieldkey_to,fieldkey_links,fieldkey_nodes,chartPadding,chartMargin,nodePadding,chartOffset,minCellWidth';
            // 对配置项进行合并
            this.mergeOptions(setOptions, safeChangeAttrs);
            this.series = series || [];
            this.status = 0;
            if (this.series.length === 0) {
                this.status = 1;
                this.errorHandler({
                    level: 'error',
                    text: '无数据',
                    background: '#f0f0f0'
                });
                return
            }
            this.erase();
            this.setAxisHeight();
            // 设置缩放控件范围
            this.createDataZoom();
            // 初始化布局
            this.initLayout(series).then(resolve => {

                this.transfrom.k = 1;
                this.transfrom.lastK = 1;

                if (this.animation.renderDataZoom) { cancelAnimationFrame(this.animation.renderDataZoom) };
                this.animation.renderDataZoom = requestAnimationFrame(()=>{
                        // if (this.dataZoomInstance && this.dataZoomInstance.destroy) {
                        //     this.dataZoomInstance.destroy();
                        // }
                        // 绘制缩放控件
                        this.drawDataZoom();
                    }, 16);

                if (this.animation.renderTimeTick) { cancelAnimationFrame(this.animation.renderTimeTick) };
                this.animation.renderTimeTick = requestAnimationFrame(()=>{
                        // 绘制刻度尺控件
                        this.drawTimeTicks();
                    }, 16);
                
                // 依据计算好的布局信息, 在对应的区块内绘制图/轴
                if (this.chartInstance) {
                    this.chartInstance.forEach(chart => {
                        chart.destroy && chart.destroy();
                    });
                }

                this.drawCharts();
            }, reject => {
                console.log('O.O, 意外错误');
            });
        } else {
            var safeChangeAttrs = 'direction,width,axis,height,tooltip,dragPercent,tickRenderStart,fieldkey_timestamp,fieldkey_nodeId,fieldkey_nodeText,fieldkey_from,fieldkey_to,fieldkey_links,fieldkey_nodes,chartPadding,chartOffset,chartMargin,nodePadding,minCellWidth';
            this.mergeOptions(setOptions, safeChangeAttrs);
            this.erase();
            this.setAxisHeight(true);
            if (this.series.length === 0) {
                this.status = 1;
                this.errorHandler({
                    level: 'error',
                    text: '无数据',
                    background: '#f0f0f0'
                });
                return
            }
            
            // 初始化布局
            this.initLayout(this.series).then(resolve => {
                this.transfrom.k = 1;
                this.transfrom.lastK = 1;
                if( this.animation.renderDataZoom ) { cancelAnimationFrame(this.animation.renderDataZoom) };
                this.animation.renderDataZoom = requestAnimationFrame(()=>{

                    // if (this.dataZoomInstance && this.dataZoomInstance.destroy) {
                    //     this.dataZoomInstance.destroy();
                    // }
                    // 绘制缩放控件
                    this.drawDataZoom();
                }, 16);

                if( this.animation.renderTimeTick ) { cancelAnimationFrame(this.animation.renderTimeTick) };
                this.animation.renderTimeTick = requestAnimationFrame(()=>{
                    // 绘制刻度尺控件
                    this.drawTimeTicks({
                        startValue: this.dragPercent.startValue,
                        endValue: this.dragPercent.endValue
                    });
                }, 16);
                
                // 依据计算好的布局信息, 在对应的区块内绘制图/轴
                // this.drawCharts();
                var {offset, boundary, padding, tickRenderStart, minCellWidth, nodePadding} = this.getDefaultMargin();
                this.updateChart({
                    direction: this.direction,
                    maxAxisTextWidthOrHeight: tickRenderStart,
                    offset,
                    boundary,
                    padding,
                    minCellWidth,
                    nodeTextStyle: nodePadding ? {padding: nodePadding} : null,
                    startPercent: this.dragPercent.startValue,
                    endPercent: this.dragPercent.endValue
                });
            }, reject => {
                console.warn('O.O, 意外错误');
            });
        }
    }

    // 擦除画布
    erase () {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    // 重新布局
    relayout (width, height) {
        super.relayout(width, height);
        
        if (this.series.length === 0) {
            this.errorHandler({
                level: 'error',
                text: '无数据',
                background: '#f0f0f0'
            });
            return
        }

        this.erase();

        this.setAxisHeight(true);

        // 设置缩放控件范围
        // this.createDataZoom();
        if (this.series.length === 0) {
            this.status = 1;
            this.errorHandler({
                level: 'error',
                text: '无数据',
                background: '#f0f0f0'
            });
            return
        }
        // 初始化布局
        this.initLayout(this.series).then(resolve => {
            this.transfrom.k = 1;
            this.transfrom.lastK = 1;
            
            if( this.animation.renderDataZoom ) { cancelAnimationFrame(this.animation.renderDataZoom) };
            this.animation.renderDataZoom = requestAnimationFrame(()=>{

                // if (this.dataZoomInstance && this.dataZoomInstance.destroy) {
                //     this.dataZoomInstance.destroy();
                // }
                // 绘制缩放控件
                this.drawDataZoom();
            }, 16);

            if( this.animation.renderTimeTick ) { cancelAnimationFrame(this.animation.renderTimeTick) };
            this.animation.renderTimeTick = requestAnimationFrame(()=>{
                // 绘制刻度尺控件
                this.drawTimeTicks();
            }, 16);
            

            // 依据计算好的布局信息, 在对应的区块内绘制图/轴
            // this.drawCharts();
            var {offset, boundary, padding, tickRenderStart} = this.getDefaultMargin();
            // if( this.animation.renderChartLine ) { cancelAnimationFrame(this.animation.renderChartLine) };
            // this.animation.renderChartLine = requestAnimationFrame(()=>{
                // 绘制刻度尺控件
                this.updateChart({
                    direction: this.direction,
                    maxAxisTextWidthOrHeight: tickRenderStart,
                    offset,
                    boundary,
                    padding
                });
            // }, 16);
            
        }, reject => {
            console.warn('O.O, 意外错误');
        });
    }

    // 改变绘制方向的快捷方法;
    changeDirection (direction) {
        switch (direction) {
            case 'horizontal':
                direction = 'horizontal';
                break;
            case 'vertical':
                direction = 'vertical';
                break;
            default:
                direction = 'horizontal';
                break;
        }
        this.direction = direction;
        this.relayout(this.width, this.height);
    }

    // 初始化下拉框
    renderMulteSelect () {
        this.searchSelect = new SearchSelect({
            elem: this.selector,
            multiple: true,
            disableField: 'isInsert',
            displayField: 'label',
            valueField: 'value',
            placeholder: '-查找-', // 
            data: [
                {value: 1, label: '1号选手'},
                {value: 2, label: '2号选手'},
                {value: 3, label: '3号选手'},
                {value: 4, label: '4号选手'},
                {value: 5, label: '5号选手'},
                {value: 6, label: '6号选手'},
                {value: 1, label: '1号选手'},
                {value: 2, label: '2号选手'},
                {value: 3, label: '3号选手'},
                {value: 4, label: '4号选手'},
                {value: 5, label: '5号选手'},
                {value: 6, label: '6号选手'},
                {value: 1, label: '1号选手'},
                {value: 2, label: '2号选手'},
                {value: 3, label: '3号选手'},
                {value: 4, label: '4号选手'},
                {value: 5, label: '5号选手'},
                {value: 6, label: '6号选手'}
            ]
        });
    }

    // 初始化全局 hover提示框
    renderGlobalTips () {
    }

    // 更新 hover提示框位置, 文本等; options: Object .opacity, x, y, text
    updateGlobalTips (options) {
    }


    // 数据错误的统一处理
    errorHandler (error) {
        var {level, text, background} = error;
        this.erase();

        fillRect(
            this.context,
            0,
            0,
            this.width,
            this.height,
            background
        );

        fillText(
            this.context,
            0 + this.width / 2,
            0 + this.height / 2,
            text,
            { fontSize: 14, color: '#333' }
        );
    }

    // 清除所有用户注册的监听事件
    clearUserRegistedEvent () {
        if (this.eventHandler) {
            for(var key in this.eventHelp) {
                this.eventHelp[key+'_fire'] = false;
                if( !key.endsWith('_fire') ){
                    // 
                    switch (key) {
                        case 'timetickClick':
                            this.timeTickInstance && this.timeTickInstance.off('timetickClick');
                            break;
                        default:
                            this.eventHandler.disposeAll(key);
                            break;
                    }
                }
            }
        }
    }

    // 事件绑定;
    // 因为组件采用的异步渲染, 所以函数执行时, 可能还没有完成组件的实例化, 因此在组件完成实例化阶段才挂载事件监听;
    // 支持的事件类型: dom类型事件, 组件内 所定义的事件
    on (eventType, eventDesc, cb) {
        if (this.eventHandler) {
            if (cb === undefined && typeof eventDesc === 'function') {
                cb = eventDesc;
                eventDesc = null;
            }

            // 子组件被实例化时, 判断: 事件类型_fire 是否为 true, 来为组件挂载对应的事件; 
            this.eventHelp[eventType + '_fire'] = true;
            // 而 挂载事件时所要传递的条件, 即是 传入的事件描述对象;
            this.eventHelp[eventType] = eventDesc || {};

            // 子组件完成事件挂载后, 因为考虑到被多次实例化时, 事件调用发生冲突, 所以子组件在创建事件类型时加上了唯一标识; 这也造成了我们通过 on监听的 事件类型不能和实例所创建的 事件类型时保存一致, 所以在外层组件额外定义了一套事件队列;
            this.eventHandler.addEvent(eventType, {eventType, ...this.eventHelp[eventType]}, cb, this);
        }
    }

    // 事件解绑; 支持的类型仅仅
    // 支持的事件类型: dom类型事件, 组件内所定义的事件
    // 且考虑到 添加事件时, 可能会有事件描述, 那么解绑事件同样也需要把条件删除更新;
    off (eventType, eventDesc, cb) {
        if (cb === undefined && typeof eventDesc === 'function') {
            cb = eventDesc;
            eventDesc = null;
        }
        if (!this.eventHandler) {
            return
        }

        if (eventType) {
            if (eventDesc) {
                
                // 先调用内部组件的事件销毁方法;
                if (cb) {
                    switch (eventType) {
                        case 'timetickClick':
                            this.timeTickInstance && this.timeTickInstance.off('timetickClick', eventDesc, cb);
                            break;
                        default:
                            this.eventHandler.removeEvent(eventType, cb);
                            break;
                    }
                }

                // 再处理辅助事件的对象;
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
                this.eventHelp[eventType + '_fire'] = this.eventHandler.eventHandler[eventType].length === 0;
            } else {

                // 同样: 先调用内部组件的事件销毁方法; 再处理辅助事件的对象;
                if (cb) {
                    switch (eventType) {
                        case 'timetickClick':
                            this.timeTickInstance && this.timeTickInstance.off('timetickClick', cb);
                            break;
                        default:
                            this.eventHandler.removeEvent(eventType, cb);
                            break;
                    }

                    // this.eventHelp[eventType] = null;
                    this.eventHelp[eventType + '_fire'] = this.eventHandler.eventHandler[eventType].length === 0;
                } else {
                    switch (eventType) {
                        case 'timetickClick':
                            this.timeTickInstance && this.timeTickInstance.off('timetickClick');
                            break;
                        default:
                            this.eventHandler.disposeAll(eventType);
                            break;
                    }

                    this.eventHelp[eventType] = null;
                    this.eventHelp[eventType + '_fire'] = false;
                }
            }
        } else {
            this.clearUserRegistedEvent();
        }
    }

    

    // 组件内事件, 往外传递的统一处理;
    // {@param.eventDesc} 事件描述对象
    // {@param.data} 组件内事件派发出来的参数
    // {@param.event} event 对象
    broadcastUpEvent = (eventDesc, data, event) => {
        this.eventHandler.dispatchEvent(eventDesc.eventType, data, event);
    }

    // 向内派发事件的统一处理; 这个方法在为图例设置默认状态的时候会很有用;
    // {@param.eventType} 必要参数; 事件类型, 支持的事件类型应该有: setDataZoom(设置数据缩放), legendChange(设置选中), timetickSelect(刻度尺选中) 等事件
    // {@param.eventDesc} 非必要参数; 派发事件时携带的条件, 比如只对某一个图例中的某一条数据的点击, 选中;
    // {@param.data} 非必要参数; 派发事件时传递的参数;
    dispatchAction (eventDesc) {
        var eventType = eventDesc.type;
        var data = eventDesc.data || {};
        var callback = [];

        switch (eventType.toLowerCase()) {
            // 派发数据缩放的事件: 可能是对整个图例缩放, 可能只是对其中某一个图进行缩放; 通过 groupId(也即图例的唯一 id进行判断);
            case 'datazoom':
                if (eventDesc.groupId) {
                    var newFunc = new Function(['context', 'eventDesc'], `
                        for(var i=0; i< context.chartInstance.length; i++) {
                            if(context.chartInstance[i].uid === eventDesc.groupId) {

                                    if (context.chartInstance[i].dataZoomInstance) {
                                        context.chartInstance[i].dataZoomInstance.update({
                                            startValue: parseFloat(eventDesc.start),
                                            endValue: parseFloat(eventDesc.end)
                                        });
                                    }
                                context.chartInstance[i].updateRenderNodes(null, { percent: [parseFloat(eventDesc.start), parseFloat(eventDesc.end)] });
                                break;
                            }
                        }
                    `);
                    callback.push(newFunc);
                } else {
                    var newFunc = new Function(['context', 'eventDesc'], `
                        if (context.dataZoomInstance) {
                            context.dataZoomInstance.update({
                                startValue: parseFloat(eventDesc.start),
                                endValue: parseFloat(eventDesc.end)
                            });
                            context.updateChartInstance(null, { percent: [parseFloat(eventDesc.start), parseFloat(eventDesc.end)] });
                        }
                    `)
                    callback.push(newFunc);
                }
                break;
            // 图例图层的选中事件
            case 'legendselect':
                if (eventDesc.data) {
                    var groupId = eventDesc.data.groupId,
                        name = eventDesc.data.name;
                    if (groupId && name) {
                        // var newFunc = new Function(['context', 'eventDesc'], `
                        //     for(var i=0; i< context.chartInstance.length; i++) {

                        //         if(context.chartInstance[i].uid === eventDesc.groupId) {

                        //                 if (context.chartInstance[i].dataZoomInstance) {
                        //                     context.chartInstance[i].dataZoomInstance.update({
                        //                         startValue: parseFloat(eventDesc.start),
                        //                         endValue: parseFloat(eventDesc.end)
                        //                     });
                        //                 }
                        //             context.chartInstance[i].updateRenderNodes(null, { percent: [parseFloat(eventDesc.start), parseFloat(eventDesc.end)] });
                        //             break;
                        //         }
                        //     }
                        // `);
                        // callback.push(newFunc);
                    }
                }
                break;
            // 图例图层的取消选中事件
            case 'legendunselect':

                break;
        }


        callback.forEach((func) => {
            func(this, eventDesc);
        });
    }


    // {@param.type String ->MIMEType} 导出的文件格式
    // {@param.backgroundColor String} 对图例增加的底部背景色
    // {@param.excludeComponents Array} 要忽略的组件列表
    // {@param.banner} 暂未支持, 版权/水印/加密等文字相关信息
    export2Base64Img (param) {
        param = param || {type:'image/png', backgroundColor:'#fff', excludeComponents:null};

        var imageData = this.context.getImageData(0, 0, this.width, this.height);
        var newCanvas = this.canvasHelp || document.createElement('canvas');
        newCanvas.width = this.width;
        newCanvas.height = this.height;
        var newContext = newCanvas.getContext('2d');
        newContext.putImageData(imageData, 0, 0);
        var fontSize = 12,
            sysFontFamily = getSysFont('');
        // 
        if (param.exclude) {
            this.chartInstance.forEach(lineInstance => {
                var {nodeSlider, title, indicator} = lineInstance.layout || {};
                if (param.exclude.nodeSlider) {
                    if (nodeSlider) {
                        newContext.clearRect(nodeSlider.x, nodeSlider.y, nodeSlider.width, nodeSlider.height);
                    }
                }

                if (param.exclude.nodeOperate) {
                    var defaultMargin = 10,
                        txts = ['筛选', '排序', '节点合并'],
                        direction = lineInstance.direction,
                        stackWidth = 0;
                    
                    if(direction === 'horizontal') {
                        if (lineInstance.title.filter && lineInstance.title.filter.show) {
                            stackWidth += calcBreakWord('筛选', fontSize + 'px ' + sysFontFamily) + defaultMargin;
                        }
                        if (lineInstance.title.sort && lineInstance.title.sort.show) {
                            stackWidth += calcBreakWord('排序', fontSize + 'px ' + sysFontFamily) + defaultMargin;
                        }
                        if (lineInstance.title.combine && lineInstance.title.combine.show) {
                            stackWidth += calcBreakWord('节点合并', fontSize + 'px ' + sysFontFamily) + defaultMargin;
                        }

                        newContext.clearRect(title.x, title.y, stackWidth, title.height);
                    } 
                }
            });
        }
        newContext.save();
        newContext.globalCompositeOperation = 'destination-over';
        newContext.fillStyle = param.backgroundColor || '#fff';
        newContext.rect(0, 0, this.width, this.height);
        newContext.fill();
        newContext.restore();

        this.canvasHelp = newCanvas;
        return newCanvas.toDataURL(param.type || 'image/png', 1);
    }
}

export default TimeStaticChart;
