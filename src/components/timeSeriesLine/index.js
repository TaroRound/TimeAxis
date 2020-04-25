import {linear, pointToDom, getTextChar, calcBreakWord, ellipsisText, merge_recursive, merge, getFirst, getUUid, isInRange, isMixed, isPointInBlock, noevent, stop, isBlokHidden, deepEqual, deepCopy, formatDate, isEmptyObject, getDate, arrayHas, calcTextWidth, getSysFont, type} from '../../lib/util/index';
import {getColor, color} from './config';
import {fillRect} from '../../shape/rect';
import {fillText} from '../../shape/text';
import {fillLine} from '../../shape/line';
import {Polygon} from '../../shape/polygon';
import DataZoom from '../dataZoom/index';
import NodeMarker from '../nodeMarker/index'

// 给文本添加额外的类型描述: 以图标的方式;
import ICON_duanxin from '../../assets/image/duanxin.png';
import ICON_email from '../../assets/image/email.png';
import ICON_facebook from '../../assets/image/facebook.png';
import ICON_image from '../../assets/image/image.png';
import ICON_momo from '../../assets/image/momo.png';
import ICON_opera from '../../assets/image/opera.png';
import ICON_qq from '../../assets/image/qq.png';
import ICON_qywx from '../../assets/image/qywx.png';
import ICON_skype from '../../assets/image/skype.png';
import ICON_weibo from '../../assets/image/weibo.png';
import ICON_weixin from '../../assets/image/weixin.png';
import ICON_yy from '../../assets/image/yy.png';
import ICON_zhifubao from '../../assets/image/zhifubao.png';

const sourceType_icons = {
    duanxin: ICON_duanxin,
    email: ICON_email,
    facebook: ICON_facebook,
    image: ICON_image,
    momo: ICON_momo,
    opera: ICON_opera,
    qq: ICON_qq,
    qywx: ICON_qywx,
    skype: ICON_skype,
    weibo: ICON_weibo,
    weixin: ICON_weixin,
    
    yy: ICON_yy,
    zhifubao: ICON_zhifubao,
    HY: ICON_weixin,
    QZ: ''
}

/**
 * 
    [
        {   
            name: '好友聊天', 
            zIndex: 1,
            color: 'green',
            background: '#f0f0f0',
            fixed: true,
            groupId: '22',
            title: {
                combines: {
                    show: true
                },
                filter: {
                    show: true,
                    options: []
                },
                titleText: {
                    text: '好友聊天记录'
                }
            },
            data: {
                nodes: [
                    {text: '张三', id: 1001},
                    {text: '李四', id: 1002},
                    {text: '王五', id: 1003},
                    {text: '赵六', id: 1004},
                    {text: '小七', id: 1005}
                ],
                links: [
                    {from: '1002', to: '1003', start: '2019-03-12 14:00:05', end: '2019-03-12 14:20:05'},
                    {from: '1001', to: '1003', start: '2019-03-14 11:00:05', end: '2019-03-12 14:20:05'},
                    {from: '1003', to: '1005', start: '2019-03-12 14:00:05', end: '2019-03-12 14:20:05'},
                    {from: '1005', to: '1001', start: '2019-03-13 14:00:05', end: '2019-03-12 14:20:05'},
                    {from: '1004', to: '1005', start: '2019-03-16 14:00:05', end: '2019-03-12 14:20:05'},
                    {from: '1002', to: '1003', start: '2019-04-12 14:00:05', end: '2019-03-12 14:20:05'}
                ]
            }
        },
        ...叠加的图层...
    ]
    如果有叠加的图层时:
        背景色取最后一个
        线条及文字颜色取各自的 color 或自动分配一个 color
        如果其中有任一个 fixed: true, 则表明当前整个图层的可拖拽行为 为 false, 表示整个图层位置固定, 不可移动
        标题部分: 采用累加显示(如果有设置的话)
        默认创建 筛选器: 过滤显示某些图层;
        固定的节点统一排序到起点位置;
        节点筛选器, 设置为二级层级筛选器: 以对不太关注的节点, 可以设置不展示或展示成一个点; --这一功能点是十分重要的, 等同于业务上的创建实体:为多个节点归纳为一个节点(组织);
        功能组: 为单个图层数据, 创建一个表格形式的展示: (图/表) 的切换展示

        过滤的时间范围对所有图层均生效;
        考虑的扩展: 为图例增加一个单独的时间滑动组件: 功能描述: 可接受外层时间控制(比如时间轴组件:公共的滑块滑动时, 多个图例跟随滑动): 也支持单独的时间控制;--保持外部与内部滑块的单向同步-- 

    
 */

class TimeSeriesLine {
    constructor (context, {
        x,              // 图形在 context的 x坐标
        y,              // 图形在 context的 y坐标
        width,          // 图形 x方向的最大边界;
        height,         // 图形 y方向的最大边界
        direction,      // 图形绘制的方向 'vertical' : 'horizontal'
        offset,         // 网格线和网格的距离 + 网格和文本节点/顶点 的间距
        boundary,       // 连接线的起止点偏移量
        startPercent,   // 绘制起点: 0-100 内的比例值
        endPercent,     // 绘制终点: 0-100 内的比例值
        startTimestamp, // 绘制起点: 具体的时间戳
        endTimestamp,   // 绘制终点: 具体的时间戳
        min,            // 最大时间戳
        max,            // 最小时间戳
        smooth,         // 是否开启平滑滚动
        title,          // 头部: 图形标题文本
        sort,           // 头部: 排序相关
        reverse,        // 竖坐标节点排列顺序是否倒序
        fixColumns,     // 竖坐标节点要固定的项 id列表
        background,     // 网格背景, 可接受一个颜色值或是一个渐变(仅实现一个渐变, 特定的文本格式: to right: 0% #000: 50% #ccc: 100% #fff)
        chartBackground,// 图例整个的背景色
        splitLine,      // 网格线样式设置
        nodeTextStyle,
        timeunit,       // 辅助设置时间起止点
        timeReader,     // 读取时间值函数, 默认为 new Date
        maxAxisTextWidthOrHeight,  // 预定义节点文本最大占宽: 如果没传递会从渲染的节点中找到最长的文本, 计算最长文本所占的宽, 如果有多个图时占宽是不一样的, 这个属性有利于多图形时排版的统一;
        chartId,        // 外部分配的一个图形 ID, 多图形时有利于访问到正确的图形实例
        minCellWidth,   // 控制节点展示数量辅助配置. 可能是直接的数值(如: 10), 也可能是控制间距(如 40px), 这里暂时实现的是根据间距, 去计算值 
        padding,        // 图形最外围的边距
        titleHeight,
        fieldkey_links,
        fieldkey_nodes,
        fieldkey_from,
        fieldkey_to,
        fieldkey_nodeId,
        fieldKey_nodeText,
        fieldkey_timestamp,
        fieldkey_sourcetype,
        timestampIsString,
        tooltip,        // 提升文字的配置: 可能是属性悬停/点击 轴线/图形展示相对应的文字信息. 这里暂时只实现图形的悬停提升; 
        saferange,      // 暂未实现的功能: 把图形展示数量控制在一个安全的范围之内
        nodeSlider,
        colors,
        itemStyle
    }, 
        optionList,
        eventHandler,
        canvas
    ) {
        this.canvas2DContext = context;
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.direction = direction || 'horizontal';

        this.layout = {
            title: {},
            node: {},
            grid: {},
            nodeSlider: {},
            indicator: {}
        }

        this.startPercent = startPercent || 0;
        this.endPercent = endPercent || 100;
        this.min = min || 0;
        this.max = max || 0;
        this.smooth = !!smooth;
        this.title = title || {};
        this.sort = sort || 0;
        this.reverse = !!reverse;
        this.fixColumns = fixColumns || null;

        this.nodeSlider = merge_recursive({
            show: false,
            position: 'start',
            sliderHeight: 15,
            outer: {
                background: 'rgba(255,255,255,0.3)',
                stroke: 'rgba(0,0,0,0.2)'
            },
            inner: {
                background: 'rgba(0,0,0,0.3)',
                stroke: null
            },
            boundaryText: {
                show: false
            },
            resizerStyle: {
                width: 4,
                height: 6,
                color: 'rgba(0,0,0,0)',
                position: 'center'
            }
        }, nodeSlider || {show: !!minCellWidth });
        this.minCellWidth = nodeSlider && nodeSlider.show ? minCellWidth || 1 : minCellWidth || 0;
        this.titleHeight = titleHeight || 0; // 40;
        this.timeunit = timeunit || 'year';
        this.timeReader = timeReader;
        this.timestampIsString = timestampIsString;
        this.fieldkey_links = fieldkey_links;
        this.fieldkey_nodes = fieldkey_nodes;
        this.fieldkey_nodeId = fieldkey_nodeId;
        this.fieldkey_from = fieldkey_from;
        this.fieldkey_to = fieldkey_to;
        this.fieldkey_timestamp = fieldkey_timestamp; // timestamp
        this.fieldKey_nodeText = fieldKey_nodeText;
        this.fieldkey_sourcetype = fieldkey_sourcetype;
        this.tooltip = tooltip || {show: true};
        this.saferange = saferange || this.endPercent - this.startPercent;
        
        this.colors = colors || color;
        this.itemStyle = merge_recursive({
            line: {
                normal: {
                    color: '#fff',
                    size: 1
                },
                emphasis: {
                    color: this.colors[0], // '#AEFFD4'
                    size: 1
                }
            },
            polygon: {
                normal: {
                    color: '#fff',
                    size: 5,
                    shapeSides: 3
                },
                emphasis: {
                    color: this.colors[0],
                    size: 6,
                    shapeSides: 3
                }
            },
            circle: {
                normal: {
                    color: this.colors[0],
                    size: 5,
                    shapeSides: 3
                },
                emphasis: {
                    color: this.colors[0],
                    size: 6,
                    shapeSides: 3
                }
            },
            shadow: {}
        }, itemStyle);
        this.themeConfig = null;

        this.uid = chartId !== undefined ? chartId : getUUid();
        this.eventHandler = eventHandler || {};
        this.canvas = canvas || null;
        this.optionsList = optionList || [];
        this.background = background || 'to bottom:0% #75A4FF:100% #4258E5'; // `to ${direction === 'horizontal' ? 'right' : 'bottom'}: 0 #f0f0f0: 50% rgba(0,0,0,0.2): 100% #f0f0f0`
        this.chartBackground = chartBackground;

        this.linearScalePercentWidthValue = linear([0, 100], [this.min, this.max]);
        this.linearScaleNodesWithIndex = null;
        this.linearScaleTimeWithTimestamp = null;
        this.linearRenderPercentWithWidth = null;
        this.maxAxisTextWidthOrHeight = maxAxisTextWidthOrHeight || null;
        this.nodeTextStyle = merge_recursive({
            fontSize: 12,
            color: '#666',
            background: null,
            padding: {      // 这个值会被网格继承, 因为要保持文本和线条的位置一致
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }
        }, nodeTextStyle || {});

        this.gridLineStyle = merge_recursive({
            dash: undefined, // [5, 10, 5, 10]
            color: '#DCDFE6'
        }, splitLine || {});

        this.linkLineStyle = {
            color: '#fff',
            activeColor: 'red'
        }
        this.startTime = null;
        this.endTime = null;
        this.layers = [];   // 图层信息
        this.nodes = [];    // 所有 待绘制的节点-缓存
        this.links = [];    // 所有 待绘制的链接线-缓存
        this.renderNodeTask = [];    // 绘制节点的任务队列
        this.renderLinkTask = [];    // 绘制节点的任务队列
        this.renderNodeFilterFieldKey = undefined;
        this.renderNodeFilterValueRange = [];
        this.renderNodeValueRange = [];

        this.nodeIndexCache = {} // 保持所有节点的索引的一个对象, 以根据节点 id快速查找到节点索引位置

        // 默认定义的一些边距
        this.offset = Object.assign({top: 10, bottom: 10, left: 10, right: 10}, offset || {}); // 网格线与网格之间的间距
        this.boundary = Object.assign({top: 10, bottom: 10, left: 10, right: 10}, boundary || {});   // 链接线条与网格之间的间距
        this.padding = Object.assign({top: 0, bottom: 0, left: 0, right: 0}, padding || {});
        this.grid = {};

        this.animation = {};
        this.renderedLinkShape = [];
        this.hoveredLinks = [];

        this.eventRecord = [];
        this.registerBlocks = [];
        this.markAres = [];
        this.transform = {
            x: 0, 
            y: 0, 
            k: 1
        };
        this.transformHelp = {}
        this.startPercent_cache = this.startPercent;
        this.endPercent_cache = this.endPercent;
        if (this.optionsList && this.optionsList.length) {
            var hasNodes = this.optionsList.some(option => {
                fieldkey_nodes = option.fieldkey_nodes || fieldkey_nodes;
                return option.data && option.data[fieldkey_nodes] && option.data[fieldkey_nodes].length > 0;
            });
            if (hasNodes) {
                this.init();
            } else {
                // this.createGrid();
                this.errorHandler({
                    type: 'warn',
                    message: '无数据',
                    text: '无数据'
                });
            }
        }
    }

    // 错误处理
    // 没有数据时, 同样会调用这个方法
    errorHandler (error, boxModel) {
        // var {x, y, width, height} = boxModel || this;
        var { background, offset, direction } = this;
        var {x, y, width, height} = this.layout.grid;

        this.erase({
            x, y, width, height
        });

        if (direction === 'horizontal') {
            fillRect(this.canvas2DContext, x + offset.left, y, width - offset.left - offset.right, height, background);
        } else {
            fillRect(this.canvas2DContext, x, y + offset.top, width, height - offset.top - offset.bottom, background);
        }

        // this.clearAllEvent();
        for (var key in this.animation) {
            if (this.animation[key]) { cancelAnimationFrame(this.animation[key]) }
        }

        if (this.eventHandler) {
            // this.eventHandler.removeEvent('mousemove', this.setHover);
            // 清除节点操作, 图层操作的事件
            this.removeRegisterBlock();
            // 清除自定义事件
            for (var i = 0; i < this.eventRecord.length; i++ ) {
                this.eventManager.disposeAll(this.eventRecord[i]);
            };
        }

        if (this.dataZoomInstance) {
            this.dataZoomInstance.destroy();
            this.dataZoomInstance = null;
        }

        error.text && fillText(
            this.canvas2DContext,
            x + width / 2,
            y + height / 2,
            error.text,
            { fontSize: 12, color: '#fff', align: 'center', verticle: 'middle' }
        );
    }


    // 初始化: 考虑到可能会有超大级的数据, 因此使用异步渲染, 防止页面直接卡死;
    init () {
        if (this.animation.render_chart) { cancelAnimationFrame(this.animation.render_chart) };
        this.animation.render_chart = requestAnimationFrame(() => {
            
            // 根据设置的百分比, 设定值的区间
            this.initTimeRange();
            // 根据设定的值的区间, 筛选出值区间内的节点, 线条; 并且建立起值区间内值的缓存
            this.createRenderNodesAndLinks();

            this.initLayout()
            var {title, node, grid, nodeSlider, indicator} = this.layout;
            if (this.nodes.length === 0 && this.links.length === 0) {

                this.errorHandler({
                    type: 'warn',
                    message: '无数据',
                    text: '无数据'
                }, grid);
                return;
            }

            this.filterNodeAndLinksByLegend();
            // 依据上一步 建立起的值区间内值的缓存, 再对其进行筛选过滤
            this.createNodeSliders();
            // 再依据上一步过滤后的值, 计算出所有文本的最大宽度: 这个步骤在当前功能下不推荐操作, 它会破坏整体图形的样式统一性; 因此传入了统一的固定值(不计算)
            this.calcMaxTextWidthOrHeight();
            // 根据传入的图层数据, 组合头部信息
            this.createTitle();
            
            this.createScaleNodes();
            this.createScaleTimes();
            this.renderFullChartBackground();


            // 头部: 节点操作, 标题, 筛选等相关功能
            if (!isBlokHidden(title)) {
                if (this.animation.renderTitle) { cancelAnimationFrame(this.animation.renderTitle) }
                this.animation.renderTitle = requestAnimationFrame(
                    ()=>{
                        this.removeRegisterBlock();
                        this.renderTitle();
                        this.addRegisterBlock();
                    }, 0);
            }

            this.renderGrid();
            // 节点和节点筛选模块
            if (this.animation.renderNodes) { cancelAnimationFrame(this.animation.renderNodes) };
            this.animation.renderNodes = requestAnimationFrame(
                ()=>{
                    !isBlokHidden(node) && (
                        this.renderNodes(),
                        this.nodeMarkHandler()
                    );
                    !isBlokHidden(nodeSlider) && this.renderNodeSlider();
                }, 0);  

            if (this.animation.renderLinks) { cancelAnimationFrame(this.animation.renderLinks) };
            this.animation.renderLinks = requestAnimationFrame(
                ()=>{
                    this.renderLinks();
                }, 15);
        }, 0); // 16

        // 
        this.initEventHandler();
    }

    // 更新图例: 出于代码的稳定性考虑, 只允许更新部分属性值;
    update (options, data) {
        var mergeOptions = {};
        // 允许被修改的属性配置
        var safeAttrs = 'x,y,width,height,direction,startPercent,endPercent,min,max,smooth,sort,reverse,color,fixColumns,timeunit,boundary,offset,padding,maxAxisTextWidthOrHeight,minCellWidth,nodeTextStyle';
        var safeAttribute = safeAttrs.split(',');

        if (options) {
            safeAttribute.forEach(attr => {
                if (options.hasOwnProperty(attr)) {
                    mergeOptions[attr] = options[attr];
                }
                switch (attr) {
                    case 'minCellWidth':
                        if (options[attr]) {
                            if (!this.nodeSlider.show) {
                                this.nodeSlider.show = true;
                            }
                        }
                        break;
                    default:
                        break;
                }
            });
        }
        // 对配置项进行合并:
        merge_recursive(this, mergeOptions);
        this.transform.k = 1;
        this.transform.x = 0;
        this.transform.y = 0;

        // this.animation.render_chart = requestAnimationFrame(() => {
            var layers = [];
            // var t1 = Date.now(); 
            // this.performance['值合并'] = this.performance['值合并'] ? this.performance['值合并'] + (t1 - time_start) : (t1 - time_start);
            // this.performance['值合并-当前帧'] = (t1 - time_start);

            // 如果数据有更新: 那么需要对图形整个的刷新
            if (data) {
                if (data.length === 0) {
                    this.createGrid();
                    this.errorHandler({
                        type: 'warn',
                        message: '无数据',
                        text: '无数据'
                    });

                    return;
                }
                layers = this.optionsList.slice(0, data.length);
                merge_recursive(layers, data);
                this.optionsList = layers;
                this.saferange = this.endPercent - this.startPercent;

                // 重设置;
                // this.erase();
                // 根据设置的百分比, 设定值的区间
                this.initTimeRange();
                // 根据设定的值的区间, 筛选出值区间内的节点, 线条; 并且建立起值区间内值的缓存
                this.createRenderNodesAndLinks();
                
                this.initLayout();

                var {title, node, grid, nodeSlider, indicator} = this.layout;
                if (this.nodes.length === 0 && this.links.length === 0) {
                    this.errorHandler({
                        type: 'warn',
                        message: '无数据',
                        text: '无数据'
                    }, grid);
                    return;
                }
                
                this.filterNodeAndLinksByLegend();
                // 依据上一步 建立起的值区间内值的缓存, 再对其进行筛选过滤
                this.createNodeSliders();
                // 再依据上一步过滤后的值, 计算出所有文本的最大宽度: 这个步骤在当前功能下不推荐操作, 它会破坏整体图形的样式统一性; 因此传入了统一的固定值(不计算)
                this.calcMaxTextWidthOrHeight();
                // 根据传入的图层数据, 组合头部信息
                this.createTitle();
                
                this.createScaleNodes();
                this.createScaleTimes();
                // this.renderFullChartBackground();


                var time_s5;
                // 头部: 节点操作, 标题, 筛选等相关功能
                if (!isBlokHidden(title)) {
                    if (this.animation.renderTitle) { cancelAnimationFrame(this.animation.renderTitle) }; // cancelAnimationFrame
                    this.animation.renderTitle = requestAnimationFrame(()=>{ // requestAnimationFrame
                            this.removeRegisterBlock();
                            this.renderTitle();
                            this.addRegisterBlock();
                        }, 0);
                }
    
                this.erase(grid);
                this.renderGrid();

                if (this.animation.renderNode) { cancelAnimationFrame(this.animation.renderNode) }; // setTimeout, cancelAnimationFrame
                this.animation.renderNode = requestAnimationFrame(()=>{
                    !isBlokHidden(node) && (
                        this.renderNodes(),
                        this.nodeMarkHandler()
                    );
                    !isBlokHidden(nodeSlider) && this.renderNodeSlider();
                }, 0);

                this.renderLinks();
            }
            // 否则只是针对一些配置项进行更新;
            else {

                // 重设置;
                // this.erase({});
                // 根据设置的百分比, 设定值的区间
                this.initTimeRange();
                // 根据设定的值的区间, 筛选出值区间内的节点, 线条; 并且建立起值区间内值的缓存
                this.createRenderNodesAndLinks(true);

                // var time_start2 = Date.now();
                // this.performance['缓存的建立'] = this.performance['缓存的建立'] ? this.performance['缓存的建立'] + (time_start2 - t1) : (time_start2 - t1);
                // this.performance['缓存的建立-当前帧'] = (time_start2 - t1);

                // 初始化各小模块的布局:
                this.initLayout();

                var {title, node, grid, nodeSlider, indicator} = this.layout;

                // var time_s3 = Date.now();
                // this.performance['布局的初始化'] = this.performance['布局的初始化'] ? this.performance['布局的初始化'] + (time_s3 - time_start2) : (time_s3 - time_start2);
                // this.performance['布局的初始化-当前帧'] = (time_s3 - time_start2);

                if (this.nodes.length === 0 && this.links.length === 0) {
                    this.removeRegisterBlock();
                    this.registerBlocks.length = 0;
                    this.renderedLinkShape.length = 0;
                    // this.erase(node);
                    // this.erase(title);
                    // this.erase(nodeSlider);
                    this.erase({});
                    this.errorHandler({
                        type: 'warn',
                        message: '无数据',
                        text: '无数据'
                    }, grid);
                    return;
                }

                this.filterNodeAndLinksByLegend();
                // 依据上一步 建立起的值区间内值的缓存, 再对其进行筛选过滤
                this.createNodeSliders();
                // 再依据上一步过滤后的值, 计算出所有文本的最大宽度: 这个步骤在当前功能下不推荐操作, 它会破坏整体图形的样式统一性; 因此传入了统一的固定值(不计算)
                // this.calcMaxTextWidthOrHeight();
                // 根据传入的图层数据, 组合头部信息
                this.createTitle();
                
                this.createScaleNodes();
                this.createScaleTimes();
                // this.renderFullChartBackground();

                // var time_s4 = Date.now();
                // this.performance['绘制前的预定义'] = this.performance['绘制前的预定义'] ? this.performance['绘制前的预定义'] + (time_s4 - time_s3) : (time_s4 - time_s3);
                // this.performance['绘制前的预定义-当前帧'] = (time_s4 - time_s3);

                var time_s5;
                // 头部: 节点操作, 标题, 筛选等相关功能
                if (!isBlokHidden(title)) {
                    if (this.animation.renderTitle) { clearTimeout(this.animation.renderTitle) }; // cancelAnimationFrame
                    this.animation.renderTitle = setTimeout(()=>{ // requestAnimationFrame
                            this.removeRegisterBlock();
                            this.renderTitle();
                            this.addRegisterBlock();
                            // time_s5 = Date.now();
                            // console.log('绘制头部', time_s5 - time_s4);
                            // this.performance['绘制标题栏'] = this.performance['绘制标题栏'] ? this.performance['绘制标题栏'] + (time_s5 - time_s4) : (time_s5 - time_s4);
                            // this.performance['绘制标题栏-当前帧'] = (time_s5 - time_s4);
                        }, 50);
                }
    
                this.erase(grid);
                this.renderGrid();
                this.renderLinks();
                // var time_s7 = Date.now();
                // this.performance['绘制线条'] = this.performance['绘制线条'] ? this.performance['绘制线条'] + (time_s7 - (time_s5 || time_s4)) : (time_s7 - (time_s5 || time_s4));
                // this.performance['绘制线条-当前帧'] =  (time_s7 - (time_s5 || time_s4));
                
                if (this.animation.renderNode) { cancelAnimationFrame(this.animation.renderNode) }; // setTimeout, cancelAnimationFrame
                this.animation.renderNode = requestAnimationFrame(()=>{
                    !isBlokHidden(node) && (
                        this.renderNodes(),
                        this.nodeMarkHandler()
                    );
                    !isBlokHidden(nodeSlider) && this.renderNodeSlider();
                }, 0);
                
                // var time_s6 = Date.now();
                // this.performance['绘制节点'] = this.performance['绘制节点'] ? this.performance['绘制节点'] + (time_s6 - time_s7) : (time_s6 - time_s7);
                // this.performance['绘制节点-当前帧'] = (time_s6 - time_s7);
                // this.performance['当前帧绘制计时'] = time_s6 - time_start;
                // this.performance['帧数绘制总计时'] = this.performance['帧数绘制总计时'] ? this.performance['帧数绘制总计时'] + (time_s6 - time_start) : (time_s6 - time_start);
                // console.log('输出性能记录', this.performance);
            }
        // }, 16); // 16
    }

    // 根据配置项, 创建出来几大板块基本的布局信息: 这个布局在重绘时会很有用 , 只需要对部分区域的图例进行擦除更新
    // {return this.layout}
    // { layout.title } 标题的基本布局, 在绘制标题时, 各个文本的坐标还会再计算
    // { layout.node } 节点的布局
    // { layout.grid } 网格的布局:
    // { layout.nodeSlider } 节点滑块的布局
    // { layout.indicator } 额外未被使用的底部;
    initLayout () {
        // return new Promise((resolve, reject) => {
            try {
                var layer_title = {};
                var layer_node = {};
                var layer_grid = {};
                var layer_nodeSlider = {};
                var layer_indicator = {};
                var {x, y, width, height, padding, offset, nodeTextStyle, titleHeight, maxAxisTextWidthOrHeight} = this;
                var {position, sliderHeight} = this.nodeSlider;
                var hasSlider = this.nodeSlider.show;
                var indicator_height = (this.indicator || {}).height || 0;    // 暂未添加的内容, 预留出的底部空间

                // 整个图例按照从上往下, 
                // top: 标题栏
                // center: 左边(节点)  右间(链接线) + 节点滚动筛选(靠左或靠右, 视参数 position: start|center|end 而定) 
                // bottom: 指示栏()
                if (this.direction === 'horizontal') {
                    sliderHeight = sliderHeight || 15;
                    var commonY = y + padding.top + titleHeight,
                        commonHeight = height - padding.top - padding.bottom - titleHeight - indicator_height;

                    if (hasSlider) {
                        switch (position) {
                            case 'center':
                                layer_nodeSlider = {
                                    x: x + padding.left + maxAxisTextWidthOrHeight,
                                    y: commonY,
                                    width: sliderHeight,
                                    height: commonHeight
                                }
                                layer_node = {
                                    x: x + padding.left,
                                    y: commonY,
                                    width: maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                layer_grid = {
                                    x: x + padding.left + sliderHeight + maxAxisTextWidthOrHeight,
                                    y: commonY,
                                    width: width - padding.left - padding.right - sliderHeight - maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                break;
                            case 'end':
                                layer_nodeSlider = {
                                    x: x + width - padding.right - sliderHeight,
                                    y: commonY,
                                    width: sliderHeight,
                                    height: commonHeight
                                }
                                layer_node = {
                                    x: x + padding.left,
                                    y: commonY,
                                    width: maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                layer_grid = {
                                    x: x + padding.left + maxAxisTextWidthOrHeight,
                                    y: commonY,
                                    width: width - padding.left - padding.right - sliderHeight - maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                break;
                            case 'start':
                            default:
                                layer_nodeSlider = {
                                    x: x + padding.left,
                                    y: commonY,
                                    width: sliderHeight,
                                    height: commonHeight
                                }
                                layer_node = {
                                    x: x + padding.left + sliderHeight,
                                    y: commonY,
                                    width: maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                layer_grid = {
                                    x: x + padding.left + sliderHeight + maxAxisTextWidthOrHeight,
                                    y: commonY,
                                    width: width - padding.left - padding.right - sliderHeight - maxAxisTextWidthOrHeight,
                                    height: commonHeight
                                }
                                break;
                        }
                    } else {
                        layer_node = {
                            x: x + padding.left,
                            y: commonY,
                            width: maxAxisTextWidthOrHeight,
                            height: commonHeight
                        }
                        layer_grid = {
                            x: x + padding.left + maxAxisTextWidthOrHeight,
                            y: commonY,
                            width: width - padding.left - padding.right - maxAxisTextWidthOrHeight,
                            height: commonHeight
                        }
                    }

                    layer_indicator = {
                        x: x + padding.left,
                        y: commonY + commonHeight,
                        width: width - padding.left - padding.right,
                        height: indicator_height
                    }

                    layer_title = {
                        x: x + padding.left,
                        y: y + padding.top,
                        width: width - padding.left - padding.right,
                        height: titleHeight
                    }
                } else {
                    sliderHeight = sliderHeight || 15;
                    var commonX = x + padding.left + (this.reverse ? indicator_height : 0),
                        commonWidth = width - padding.left - padding.right - indicator_height;

                    if (hasSlider) {                        
                        switch (position) {
                            case 'center':
                                layer_nodeSlider = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight,
                                    width: commonWidth,
                                    height: sliderHeight
                                }
                                layer_node = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight,
                                    width: commonWidth,
                                    height: maxAxisTextWidthOrHeight
                                }
                                layer_grid = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight + sliderHeight,
                                    width: commonWidth,
                                    height: height - padding.top - padding.bottom - titleHeight - maxAxisTextWidthOrHeight - sliderHeight
                                }
                                break;
                            case 'end':
                                layer_nodeSlider = {
                                    x: commonX,
                                    y: y + height - padding.bottom - sliderHeight,
                                    width: commonWidth,
                                    height: sliderHeight
                                }
                                layer_node = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight,
                                    width: commonWidth,
                                    height: maxAxisTextWidthOrHeight
                                }
                                layer_grid = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight,
                                    width: commonWidth,
                                    height: height - padding.top - padding.bottom - titleHeight - maxAxisTextWidthOrHeight - sliderHeight
                                }
                                break;
                            case 'start':
                            default:
                                layer_nodeSlider = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight,
                                    width: commonWidth,
                                    height: sliderHeight
                                }
                                layer_node = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight + sliderHeight,
                                    width: commonWidth,
                                    height: maxAxisTextWidthOrHeight
                                }
                                layer_grid = {
                                    x: commonX,
                                    y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight + sliderHeight,
                                    width: commonWidth,
                                    height: height - padding.top - padding.bottom - titleHeight - maxAxisTextWidthOrHeight - sliderHeight
                                }
                                break;
                        }
                    } else {
                        layer_node = {
                            x: commonX,
                            y: y + padding.top + titleHeight,
                            width: commonWidth,
                            height: maxAxisTextWidthOrHeight
                        }
                        layer_grid = {
                            x: commonX,
                            y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight,
                            width: commonWidth,
                            height: height - padding.top - padding.bottom - titleHeight - maxAxisTextWidthOrHeight
                        }
                    }

                    layer_indicator = {
                        x: this.reverse ? x + padding.left : x + (width - padding.left - padding.right - indicator_height),
                        y: y + padding.top + titleHeight + maxAxisTextWidthOrHeight,
                        width: indicator_height,
                        height: height - padding.top - padding.bottom - titleHeight - maxAxisTextWidthOrHeight
                    }

                    layer_title = {
                        x: x + padding.left,
                        y: y + padding.top,
                        width: width - padding.left - padding.right,
                        height: titleHeight
                    }
                };

                this.layout = {
                    title: layer_title,
                    node: layer_node,
                    grid: layer_grid,
                    nodeSlider: layer_nodeSlider,
                    indicator: layer_indicator
                }
        //         resolve();
            } catch (e) {
        //         console.warn('布局初始化失败, 错误信息', e)
        //         reject();
            }
        // });
    }

    createGrid () {
        var x, y, width, height;
        if (this.direction === 'horizontal') {
            x = this.x + this.maxAxisTextWidthOrHeight + this.offset.left + this.padding.left;
            y = this.y + this.titleHeight + this.padding.top;
            width = this.width - this.maxAxisTextWidthOrHeight - this.offset.left - this.padding.left - this.offset.right - this.padding.right; //  - this.offset.right
            height = this.height - this.titleHeight - this.padding.top - this.padding.bottom;
        } else {
            x = this.x + this.padding.left;
            y = this.y + this.maxAxisTextWidthOrHeight + this.titleHeight + this.offset.top + this.padding.top;
            width = this.width - this.padding.left - this.padding.right;
            height = this.height - this.titleHeight - this.maxAxisTextWidthOrHeight - this.offset.top - this.offset.bottom - this.padding.top - this.padding.bottom; //  - this.offset.bottom
        }

        this.grid.x = x;
        this.grid.y = y;
        this.grid.width = width;
        this.grid.height = height;
        this.grid.background = this.background;
    }

    erase ({x, y, width, height}) {
        this.canvas2DContext.clearRect(x || this.x, y || this.y, width || this.width, height || this.height);
    }

    // 创建基本的布局: 图标题部分, 包括
    //  1. 图形固定/拖动: 拖动到其他图例 可以参与到其他图形的合并, 把当前图例的所有图形与目标图例进行合并展示;
    //  2. 图形之间的排序(非固定), 对图例位置的对调;
    //  3. 图例标题
    //  4. 排序: 对选择节点依据某些属性值, 执行倒叙/顺序 排序, 这个排序会对 渲染后续的时间序列图都造成影响
    //  5. 筛选: 可以过滤展示节点:
    //  6. 合并: 可以对选中的所有节点 "合并" 展示成一个节点, 也可以对合并后的分组再合并
    // 而且如果具体项不展示, 那么具体项则不应该纳入到计算
    createTitle () {
        var isFixed = false,
            showFixed = false,
            titleText = null,
            sort = null,
            filter = null,
            legend = null,
            combine = null,
            combineLayer = null,
            isShow = this.optionsList.some(option => option.title && (option.title.show == undefined || option.title.show));
        
        try {
            this.optionsList.forEach((option,index) => {

                var title = option.title || {};
                if (title.titleText) { //  && title.titleText.show
                    
                    if (titleText) {
                        if (title.show == undefined || title.show) {
                            titleText.text += '/' + title.titleText.text;
                        }
                    } else {
                        titleText = { 
                            show: title.titleText.show == undefined ? true : title.titleText.show,
                            text: title.titleText.text,
                            color: title.titleText.color || '#666',
                            fontSize: title.titleText.fontSize || 14,
                            fontFamily: title.titleText.fontFamily || getSysFont(title.text),
                            align: title.titleText.align || 'center'
                        }
                    }
                };

                // 图层锁定
                if (title.fixed) {
                    isFixed = isFixed || !!title.fixed.fix;
                    showFixed = showFixed || !!title.fixed.show;
                }

                // 节点排序
                if (title.sort && title.sort.show) {
                    if (sort) {
                        sort.options = this.mergeOptions(sort.options, title.sort.options||[]);
                    } else {
                        sort = {
                            show: true,
                            options: [...title.sort.options||[]]
                        }
                    }
                }

                // 节点筛选
                if (title.filter && title.filter.show) {
                    if (filter) {
                        filter.options = this.mergeOptions(filter.options, title.filter.options||[]);
                    } else {
                        filter = {
                            show: true,
                            options: [...title.filter.options||[]]
                        }
                    }
                }

                // 节点合并
                if (title.combine && title.combine.show) {
                    if (combine) {
                        combine.options = this.mergeOptions(combine.options, title.combine.options||[]);
                    } else {
                        combine = {
                            show: true,
                            options: [...title.combine.options||[]]
                        }
                    }
                }

                // 节点合并
                if (title.combineLayer && title.combineLayer.show) {
                    combineLayer = {
                        show: true,
                        disable: false
                    }
                }
                
                // 图层列表
                if (option.name) {
                    if (!title.legend || (title.legend && title.legend.show)) {
                        if (legend) {
                            legend.data.push(option.name);
                            legend.color = legend.color.concat(option.color ? [option.color] : [this.colors[index]]);
                        } else {
                            legend = {
                                show: true,
                                color: option.color ? [option.color] : [this.colors[index]],
                                data: [option.name]
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('createTitle错误', e)
        }
        if (!isShow) {
            this.titleHeight = 0;
        }
        this.title.show  = isShow;
        this.title.text = titleText;
        this.title.sort = sort;
        this.title.filter = filter;
        this.title.drag = {fixed: !!isFixed, show: !!showFixed};
        this.title.legend = legend;
        this.title.combine = combine;
        this.title.combineLayer = combineLayer;
    }

    initTimeRange () {
        var start = this.linearScalePercentWidthValue.setX(this.startPercent);
        var end = this.linearScalePercentWidthValue.setX(this.endPercent);
        var startDate = this.timestampIsString ? this.timeReader(start) : start,
            endDate = this.timestampIsString ? this.timeReader(end) : end;

        this.startTime = startDate;
        this.endTime = endDate;
    }

    // 根据指定的范围, 过滤出所有的 Node节点和连接线, 
    // 并对过滤出的 Node节点, 进行"去重"--保留使用图层计数;
    // 链接线取所有匹配的链接线, 不应该去重, 并对应带上线条的颜色等状态, 以提供给绘制方法方便绘制;
    // 这一个步骤也是性能优化中的重点项
    createRenderNodesAndLinks (fromCache) {        
        // 筛选条件
        var {startTime, endTime} = this;
        var startTimeDateString = this.timestampIsString ? formatDate(startTime, 'yyyy-MM-dd hh:mm:ss') : startTime;
        var endTimeDateString = this.timestampIsString ? formatDate(endTime, 'yyyy-MM-dd hh:mm:ss') : endTime;
        
        // 待绘制的节点, 线条数据, 以及节点对应索引位置的必要缓存信息
        var links = [];
        var renderNodes = [];
        var nodeIndexCache = {};

        var t1 = Date.now();
        // 从缓存中筛选出需要的数据:
        if (fromCache) {
            var cache = {};
            var _allNodesCache = this.allNodes;
            var cacheLinkLen = this.allLinks.length;
            var cur;
            for (var i = 0; i < cacheLinkLen; i++) {
                cur = this.allLinks[i];
                if (cur['__timestamp'] >= startTimeDateString && cur['__timestamp'] <= endTimeDateString) {
                    var sid = cur['__from'],
                        tid = cur['__to'];
                    if (!cache[sid]) { //  && _allNodesCache[sid]
                        // renderNodes.push(_allNodesCache[sid])    
                        cache[sid] = true;
                    }
                    if (!cache[tid]) { //  && _allNodesCache[tid]
                        // renderNodes.push(_allNodesCache[tid])     
                        cache[tid] = true;
                    }
                    links.push(cur)
                }
            }
            // 为了保证图形操作时节点的连续性, 因此对节点再一次遍历查找;
            for (var k in _allNodesCache) {
                if (cache[k]) {
                    // push.call(renderNodes, _allNodesCache[k]);
                    renderNodes.push(_allNodesCache[k]);     
                }
            }
        } else {
            var {fieldkey_links, fieldkey_nodes, fieldkey_from, fieldkey_to, fieldkey_timestamp, fieldkey_nodeId, fieldkey_nodeText, fieldkey_sourcetype, timeReader, colors} = this;
            var allLinks = [];
            var allNodes = {};
            var idCache = {};
            var nodeIdCache = {};
            var nodeIdWithTextCache = {};
            var themeConfig = {};
            var legendStates = {};

            this.optionsList.forEach((opt, index) => {
                var seriesName = opt.name;
                // 如果没有传入读取键名, 那么尝试从单个的数据中再去查找;
                fieldkey_links = opt.fieldkey_links || fieldkey_links;
                fieldkey_nodes = opt.fieldkey_nodes || fieldkey_nodes;
                fieldkey_from = opt.fieldkey_from || fieldkey_from;
                fieldkey_to = opt.fieldkey_to || fieldkey_to;
                fieldkey_timestamp = opt.fieldkey_timestamp || fieldkey_timestamp;
                fieldkey_nodeId = opt.fieldkey_nodeId || fieldkey_nodeId;
                fieldkey_nodeText = opt.fieldkey_nodeText || fieldkey_nodeText;
                fieldkey_sourcetype = opt.fieldkey_sourcetype || fieldkey_sourcetype;
                timeReader = opt.timeReader || timeReader;

                
                var defaultColor = opt.color || getColor();
                var defaultItemStyle = deepCopy(this.itemStyle);
                merge_recursive(defaultItemStyle, {
                    circle: {
                        normal: {
                            color: defaultColor
                        },
                        emphasis: {
                            color: defaultColor
                        }
                    },
                    polygon: {
                        emphasis: {
                            color: defaultColor
                        }
                    },
                    line: {
                        emphasis: {
                            color: defaultColor
                        }
                    }
                });
                merge_recursive(defaultItemStyle, opt.itemStyle);
                
                // 配置好当前项的颜色主题;
                themeConfig[seriesName] = {
                    theme: defaultColor,
                    cancelColor: '#ccc',
                    itemStyle: defaultItemStyle
                }
                legendStates[seriesName] = true;

                // 给 link 节点添加标记, 用以区分;
                if (opt.data && opt.data[fieldkey_links] && opt.data[fieldkey_links].length) {
                    var curLinkInfo = opt.data[fieldkey_links],
                        curLinkLen = curLinkInfo.length,
                        _exportLink = links,
                        // _exportAllLink = allLinks,
                        curLink,
                        curTime, curFrom, curTo;
                        
                    for (var i = 0; i < curLinkLen; i++) {
                        curLink = curLinkInfo[i];
                        curTime = curLink[fieldkey_timestamp];
                        curFrom = curLink[fieldkey_from];
                        curTo = curLink[fieldkey_to];
                        // 遍历过程为所有节点额外创建了几个访问属性, 这一过程对性能影响很大, 
                        // 其实创建一个访问属性 __seriesName 即可(然后通过 __seriesName 管理读取到的字段 key);
                        // 但是这也意味着更新过程节点读取时, 需要根据节点本身 __seriesName 读取到正确的属性读取字段, 再根据这个字段名读取到正确的属性值;
                        // 为了能够减少一步更新过程的读取操作, 故而直接创建出全部的必要值, 舍弃了第一次建立缓存时额外的开销
                        curLink['__from'] = curLink[fieldkey_from]; // if (!curLink['__from']) {  }
                        curLink['__to'] = curLink[fieldkey_to]; // if (!curLink['__to']) {  }
                        curLink['__timestamp'] = curLink[fieldkey_timestamp]; // if (!curLink['__timestamp']) {  }
                        curLink['__seriesName'] = seriesName; // if (!curLink['__seriesName']) {  };

                        allLinks.push(curLink);
                        
                        if (curTime >= startTimeDateString && curTime <= endTimeDateString) {
                            if (!idCache[curFrom]) {
                                // task.nodeIds.push(curFrom);
                                idCache[curFrom] = true;
                            }
                            if (!idCache[curTo]) {
                                // task.nodeIds.push(curTo);
                                idCache[curTo] = true;
                            }
                            _exportLink.push(curLink);
                            // if (!curLink['__idType']) { curLink['__idType'] = task.type };
                        }
                    }
                    // opt.data[fieldkey_links].forEach(link => {});
                }
                var teLink = Date.now();
                // console.log('也只是一个小循环而已啦', teLink - tsLink, opt.data[fieldkey_links].length);

                var t1 = Date.now();
                if (opt.data && opt.data[fieldkey_nodes] && opt.data[fieldkey_nodes].length) {
                    var curNodeInfo = opt.data[fieldkey_nodes],
                        curNodeLen = curNodeInfo.length,
                        curNode,
                        _nid;
                    for (var i = 0; i < curNodeLen; i++) {
                        curNode = curNodeInfo[i];
                        _nid = curNode[fieldkey_nodeId];
                        
                        if (!allNodes[_nid]) {
                            allNodes[_nid] = deepCopy(curNode);
                        }

                        if (idCache[_nid] && allNodes[_nid]) {
                            allNodes[_nid].__layerCount = 1;

                            if (nodeIdCache[_nid]) {
                                nodeIdCache[_nid].count += 1;
                                renderNodes[ nodeIdCache[_nid].index ].__layerCount += 1;
                            } else {
                                nodeIdCache[_nid] = {
                                    index: renderNodes.length,
                                    count: 1
                                };
                                renderNodes.push(allNodes[_nid]);
                            }
                        }
                        var _commonNode = allNodes[_nid];
                        if (!_commonNode['__nodeId']) { _commonNode['__nodeId'] = _nid };
                        if (!_commonNode['__text']) { _commonNode['__text'] = _commonNode[fieldkey_nodeText] };
                        if (!_commonNode['__sourceType']) { 
                            _commonNode['__sourceType'] = [_commonNode[fieldkey_sourcetype]]
                        } else {
                            _commonNode['__sourceType'].push(_commonNode[fieldkey_sourcetype]);
                        };
                        if (!_commonNode['__seriesName']) { 
                            _commonNode['__seriesName'] = [seriesName]
                        } else {
                            _commonNode['__seriesName'].push(seriesName);
                        };
                        if (!nodeIdWithTextCache[_nid]) { nodeIdWithTextCache[_nid] = _commonNode[fieldkey_nodeText] };
                    }
                    // opt.data[fieldkey_nodes].forEach(node => {});
                }
                var t2 = Date.now();
                // console.log('单个图例, 单层所耗时间', t2 - t1, opt.data[fieldkey_nodes].length);
            });

            var com = []
            for(var key in allNodes) {
                if (allNodes[key].__layerCount > 1) {
                    com.push(allNodes[key])
                }
            };

            this.nodeIdCache = nodeIdCache;
            this.allLinks = allLinks;
            this.allNodes = allNodes;
            this.themeConfig = themeConfig;
            this.legendStates = legendStates;
            this.nodeIdWithTextCache = nodeIdWithTextCache;
        }
        var t4 = Date.now();
        // console.log('记录:对节点进行预处理', t4 - t1);

        var t5 = Date.now();
        // sort.call(renderNodes, (n1, n2) => {
        //     return n1.fixed ? -1 : n2.fixed ? 1 : 1;
        // });
        renderNodes.sort((n1, n2) => {
            return n1.fixed ? -1 : n2.fixed ? 1 : 1;
        });
        var t6 = Date.now();
        // console.log('排序环节', t6 - t5);

        var t7 = Date.now();
        renderNodes.forEach((node,index) => {
            nodeIndexCache[node['__nodeId']] = index;
        });
        var t8 = Date.now();
        // console.log('建立缓存环节', t8 - t7);

        this.nodes = renderNodes;
        this.links = links;
        this.nodeIndexCache = nodeIndexCache;
        
        var t2 = Date.now();
        renderNodes = null;
        nodeIndexCache = null;
        links = null;
        
        // console.log('记录:创建渲染节点和线条所需时间', t2 - t1);
    }

    // 计算文本最大宽度或高度: 横向时直接计算最长文本宽度, 纵向时计算最长文本高度;
    // 这一步过程建议放弃:
    calcMaxTextWidthOrHeight (verticalCellWidth) {
        var {fieldkey_nodeText} = this;
        var fontSize = this.nodeTextStyle.fontSize || 12;
        var lineHeight = this.nodeTextStyle.lineHeight || fontSize * 1.5;

        // 如果已经计算过, 不再重复计算最大宽度;
        if (this.maxAxisTextWidthOrHeight) {
            return
        }

        var texts = this.renderNodeTask.map(node => {
            return getTextChar(node['__text'] || '');
        });
        var maxCharIndex = 0, 
            maxSize, maxChar;
        texts.forEach((char, index) => {
            var {zh, en_l, en_u, num, space} = char || '';
            var relativeSize = zh * 10 + en_l * 7.5 + en_u * 8.5 + num * 5 + space * 2;

            maxCharIndex = maxSize > relativeSize ? maxCharIndex : index;
            maxSize = maxSize > relativeSize ? maxSize : relativeSize;
        });
        maxChar = this.renderNodeTask[maxCharIndex] && this.renderNodeTask[maxCharIndex].text || '';

        if (this.direction === 'horizontal') {
            // 横向: 直接计算最长字符串的占宽
            this.maxAxisTextWidthOrHeight = calcTextWidth(maxChar, fontSize + 'px ' + getSysFont(''));
        } else {
            var breakWords = calcBreakWord(maxChar, verticalCellWidth || 50, fontSize);
            // 断行: 行数 * 行高
            this.maxAxisTextWidthOrHeight = breakWords.length * lineHeight;
        }
    }

    // 依赖于已经计算出的 渲染节点, 再根据可视节点来对渲染节点和线条的再筛选;
    // valueRangeDescription, 值范围的一个描述信息, 这个值应该是一个数值类型;
    //  {key: 'age', range: [20, 60]}
    createNodeSliders (valueRangeDescription) {
        valueRangeDescription = valueRangeDescription || {};
        var fieldKey = valueRangeDescription.key,
            valueRange = valueRangeDescription.range,
            hasSlider = this.nodeSlider.show,
            idCache = {},
            isReverce = this.reverse,
            layer_nodeSlider = this.layout.nodeSlider,
            nodesHeight = 0,
            renderCount,
            nodesLength,
            nodes,
            links,
            _sourceNodes = this.$nodes,
            _sourceLinks = this.$links,
            maxValueRange = [];

        // 如果没有声明值范围的描述, 那么依据节点排列顺序, 无论节点的倒叙/逆序, 直接取前几/尾几(n), 这个 n依据 暂时依据最小节点间隙来计算
        if (!fieldKey || fieldKey === 'index') {
            if (hasSlider) {
                if (valueRange) {
                    valueRange[0] = parseInt(valueRange[0]);
                    valueRange[1] = parseInt(valueRange[1]);
                    // if (isReverce) {
                    nodes = _sourceNodes.slice(valueRange[0], valueRange[1]);
                } else {
                    if (!this.minCellWidth) {
                        renderCount = _sourceNodes.length;
                    } else if (this.minCellWidth > 0) {
                        nodesHeight = this.direction === 'horizontal'
                                ? layer_nodeSlider.height
                                : layer_nodeSlider.width
                        renderCount = Math.floor(nodesHeight / this.minCellWidth);
                    }
                    nodes = _sourceNodes.slice(0, renderCount);
                    renderCount = renderCount < nodes.length ? renderCount : nodes.length;
                    valueRange = [0, renderCount]
                }
            } else {
                renderCount = _sourceNodes.length;
                valueRange = [0, renderCount];
                nodes = _sourceNodes;
            }
            fieldKey = fieldKey || 'index';
            maxValueRange = [0, _sourceNodes.length];
            nodes.forEach(node => {
                idCache[node['__nodeId']] = true;
            });
            links = _sourceLinks.filter(link => {
                return idCache[link['__from']] && idCache[link['__to']]
            });
        } else {
            if (valueRange && Array.isArray(valueRange)) {
                // 
                nodes = _sourceNodes.filter(node => {
                    var _val = node[fieldKey];
                    var isInRange = valueRange[0] <= _val && _val <= valueRange[1];
                    maxValueRange[0] = maxValueRange[0] <= _val ? maxValueRange[0] : _val;
                    maxValueRange[1] = maxValueRange[1] >= _val ? maxValueRange[1] : _val;
                    if (isInRange) {
                        idCache[node['__nodeId']] = true;
                    }
                    return isInRange
                });

                links = _sourceLinks.filter(link => {
                    return idCache[link['__from']] && idCache[link['__to']]
                });
            } else if (typeof valueRange === 'function') {
                nodes = valueRange(_sourceNodes, 'nodes') || [];
                links = valueRange(_sourceLinks, 'links') || [];
            }
        }
        var nodeIndexCache = {};
        nodes.forEach((node,index) => {
            nodeIndexCache[node['__nodeId']] = index;
        });
        // console.log('记录操作条件', fieldKey, valueRange);
        // this.nodeSliderFilterParams = {
        //     fieldKey: fieldKey,
        //     range: valueRange
        // }
        this.renderNodeTask = nodes;
        this.renderLinkTask = links;
        this.renderNodeFilterFieldKey = fieldKey;
        this.renderNodeFilterValueRange = valueRange;
        this.renderNodeValueRange = maxValueRange;
        this.nodeIndexCache = nodeIndexCache;
    }

    createScaleNodes () {
        var {nodeTextStyle, offset, layout} = this;
        var p1Height, p2Height, padding_left, padding_right;
        var filteredRenderNode = this.renderNodeTask;

        // 横向: 从上到下的绘图顺序
        if (this.direction === 'horizontal') {
            var node_padding_top = nodeTextStyle.padding.top,
                node_padding_bottom = nodeTextStyle.padding.bottom,
                grid_offset_top = offset.top,
                grid_offset_bottom = offset.bottom;
            padding_left = node_padding_top > grid_offset_top ? node_padding_top : grid_offset_top;
            padding_right = node_padding_bottom > grid_offset_bottom ? node_padding_bottom : grid_offset_bottom;

            p1Height = layout.grid.y + padding_left;
            p2Height = layout.grid.y + layout.grid.height - padding_right;

            this.linearScaleNodesWithIndex = this.reverse ? linear([0, filteredRenderNode.length - 1], [p2Height, p1Height]) : linear([0, filteredRenderNode.length - 1], [p1Height, p2Height]);
        }
        // 纵向: 从左到右的绘图顺序 
        else {
            var node_padding_left = nodeTextStyle.padding.left,
                node_padding_right = nodeTextStyle.padding.right,
                grid_offset_left = offset.left,
                grid_offset_right = offset.right;
            padding_left = node_padding_left > grid_offset_left ? node_padding_left : grid_offset_left;
            padding_right = node_padding_right > grid_offset_right ? node_padding_right : grid_offset_right;

            p1Height = layout.grid.x + padding_left;
            p2Height = layout.grid.x + layout.grid.width - padding_right;
            this.linearScaleNodesWithIndex = this.reverse ? linear([0, filteredRenderNode.length - 1], [p2Height, p1Height]) : linear([0, filteredRenderNode.length - 1], [p1Height, p2Height]);
        }
    }

    createScaleTimes() {
        var height;
        var {boundary} = this;
        var scalePercent = this.linearScalePercentWidthValue.setX;
        var {grid} = this.layout;
        // 横向: 从左到右的绘图顺序
        if (this.direction === 'horizontal') {
            // height = this.width - this.maxAxisTextWidthOrHeight - this.offset.left - this.boundary.left - this.boundary.right - this.offset.right - this.padding.left - this.padding.right; //  - this.offset.right
            // this.linearScaleTimeWithTimestamp = linear([scalePercent(this.startPercent), scalePercent(this.endPercent)], [0, height]); // [this.min, this.max]
            // 比例下的时间戳, 和图例宽度的一个比例关系
            this.linearScaleTimeWithTimestamp = linear([scalePercent(this.startPercent), scalePercent(this.endPercent)], 
                                                        [
                                                            grid.x + boundary.left,     // 线条并不是从 0 位置开始绘制, 会有一个起止的偏移量, 所以也需要纳入进去
                                                            grid.x + grid.width - boundary.right
                                                        ]);
            // 比例和图例宽度的一个比例关系
            this.linearRenderPercentWithWidth = linear([this.startPercent, this.endPercent],
                                                        [
                                                            grid.x + boundary.left,     // 线条并不是从 0 位置开始绘制, 会有一个起止的偏移量, 所以也需要纳入进去
                                                            grid.x + grid.width - boundary.right
                                                        ]);
        }
        // 纵向: 从上到下的绘图顺序 
        else {
            // 比例下的时间戳, 和图例宽度的一个比例关系
            this.linearScaleTimeWithTimestamp = linear([scalePercent(this.startPercent), scalePercent(this.endPercent)], 
                                                        [
                                                            grid.y + boundary.top,     // 线条并不是从 0 位置开始绘制, 会有一个起止的偏移量, 所以也需要纳入进去
                                                            grid.y + grid.height - boundary.bottom
                                                        ]);
            // 比例和图例宽度的一个比例关系
            this.linearRenderPercentWithWidth = linear([this.startPercent, this.endPercent],
                                                        [
                                                            grid.y + boundary.top,     // 线条并不是从 0 位置开始绘制, 会有一个起止的偏移量, 所以也需要纳入进去
                                                            grid.y + grid.height - boundary.bottom
                                                        ]);
        }
    }

    // 添加点击区块;
    removeRegisterBlock () {
        if (this.eventHandler) {
            var blocks = this.registerBlocks || [];
            var blockLen = blocks.length;
            for (var i = 0; i < blockLen; i++) {
                this.eventHandler.removeRegisterBlock('chartOprate-' + blocks[i].name);
                this.eventHandler.removeEvent('click', this[blocks[i].name.split(':')[1]]);
            }
        }
    }

    // 添加点击区块;
    addRegisterBlock () {
        if (this.eventHandler) {
            var blocks = this.registerBlocks || [];
            var blockLen = blocks.length;

            for (var i = 0; i < blockLen; i++) {
                var {x, y, width, height} = blocks[i];
                this.eventHandler.registerEventStyleInBlockModel({
                    id: 'chartOprate-' + blocks[i].name,
                    style: 'pointer',
                    block: {
                        x1: x,
                        y1: y,
                        x2: x + width,
                        y2: y + height
                    },
                    zIndex: 2
                });

                var eventInfo = blocks[i].name.split(':'); // 
                // 事件代理添加事件时, 默认阻止了一个事件的重复注册
                this.legendChange.$repeat = true;

                this.eventHandler.addEvent('click', {
                    data: eventInfo[2],     // 触发事件时, 需要传递的一些"静态"变量
                    position: eventInfo[3],  // 触发事件的 'DOM' 位置信息, 这个信息在定位时会被用到 
                    // 为当前注册的 点击事件声明区域信息
                    block: {
                        x1: x,
                        y1: y,
                        x2: x + width,
                        y2: y + height
                    }
                }, this[eventInfo[1]]);
            }
        }
    }

    // 依据设定的选中项, 筛选节点/线条
    filterNodeAndLinksByLegend () {
        var legendSelect = this.legendStates,
            sourceNode = this.nodes,
            sourceLink = this.links,
            exportNode, exportLink
        
        exportNode = sourceNode.filter(node => {
            node.__layerCount = node['__seriesName'].filter(v => legendSelect[v]).length;
            return node.__layerCount;
            // return node['__seriesName'].some(legendName => legendSelect[legendName]);
        });

        exportLink = sourceLink.filter(link => {
            return legendSelect[link['__seriesName']];
        });

        this.$nodes = exportNode;
        this.$links = exportLink;
    }

    filterNodes = (e, canvas, data) => {
        console.log('筛选节点', data);
    }
    sortNodes = (e, canvas, data) => {
        console.log('节点排序', data);
    }
    combineNodes = (e, canvas, data) => {
        console.log('节点合并', data);
    }
    lockLayer = (e, canvas, data) => {
        console.log('图层锁定', data);
    }
    combineLayer = (e, canvas, data) => {
        console.log('图层合并', data);
    }
    legendChange = (e, canvas, data) => {
        if (this.animation.updateRenderNodes) { cancelAnimationFrame(this.animation.updateRenderNodes) }
        this.animation.updateRenderNodes = requestAnimationFrame(()=>{
            var {node, grid, nodeSlider, title} = this.layout;
            this.erase(node);
            this.erase(grid);
            this.erase(nodeSlider);

            this.legendStates[data.data] = !this.legendStates[data.data];
            this.updateLegend();
            this.filterNodeAndLinksByLegend();
            this.createNodeSliders(); // this.nodeSliderFilterParams
            // 不保留节点筛选的范围, 只对百分比内的所有数据进行筛选并计算设置一个新的节点筛选范围;
            this.createScaleNodes();
            this.renderGrid();
            this.renderNodes();
            this.nodeMarkHandler();
            this.renderLinks();

            !isBlokHidden(nodeSlider) && this.renderNodeSlider();
            this.emit('legendChange', {
                groupId: this.uid,
                ...this.legendStates
            }, e);
        }, 15);
    }

    nodeMarkHandler () {
        var {x, y, width, height} = this.layout.node;
        this.eventHandler.addEvent('contextmenu', {
            block: {
                x1: x,
                y1: y,
                x2: x + width,
                y2: y + height
            }
        }, this.addMarker);
    }

    addMarker = (event, canvas, data) => {
        var point = {
            x: event.zrX,
            y: event.zrY
        }
        var markAres = this.markAres;
        var i=0, len = markAres.length, block;
        for (; i < len; i++) {
            if (isPointInBlock(point, markAres[i])) {
                block = markAres[i];
                break;
            }
        }

        if (block) {
            if (this.nodeMarkerInstance) {
                // this.nodeMarkerInstance.add({
                //     x: block.x,
                //     y: block.y,
                //     width: block.width,
                //     height: block.height
                // })
            } else {
                this.nodeMarkerInstance = new NodeMarker(this.canvas, {
                    x: block.x,
                    y: block.y,
                    width: block.width,
                    height: block.height
                }, this.eventHandler); // this.canvas2DContext, , this.canvas
            }
            console.log('走一个...');
            // 阻止浏览器默认右键行为;
            return {
                stopImmediatePropagation: true,
                stopPropagation: true
            };
        }
    }

    updateLegend () {
        var blocks = this.legendBlocks,
            color = null,
            titleBackground = this.title.background,
            indicator;
        for (var key in blocks) {
            color = this.themeConfig[key][this.legendStates[key] ? 'theme' : 'cancelColor'];
            indicator = blocks[key].indicator;
            if (titleBackground) {
                fillRect(
                    this.canvas2DContext,
                    indicator.x - 1,
                    indicator.y - 1,
                    indicator.width + 2,
                    indicator.height + 2,
                    titleBackground
                )
            } else {
                this.erase(indicator);
            }
            
            fillRect(
                this.canvas2DContext,
                indicator.x,
                indicator.y,
                indicator.width,
                indicator.height,
                color,
                null,
                indicator.borderRadiu
            )
        };
    }

    legendHandler (seriesName) {
        return function (nodesOrLinks, type) {
            var nodeCache = {};
            if (type) {

            }
        }
    }

    renderFullChartBackground () {
        var {x, y, width, height, boxshadow, chartBackground} = this;
        chartBackground = chartBackground || '#fff';
        // boxshadow = 'rgba(0,0,0,0.3):5:0:0';
        if (boxshadow) {
            fillRect(this.canvas2DContext, x + 2, y, width - 4, height, chartBackground, null, null, 'rgba(0,0,0,0.3):5:0:0');
            this.canvas2DContext.shadowColor = 'rgba(255,255,255,0)';
            this.canvas2DContext.shadowBlur = 0;
            this.canvas2DContext.shadowOffsetX = 0;
            this.canvas2DContext.shadowOffsetY = 0;
        } else {
            fillRect(this.canvas2DContext, x, y, width, height, chartBackground);
        }
        
    }

    // this.title.text = titleText;
    // this.title.sort = sort;
    // this.title.filter = filter;
    // this.title.drag = {fixed: isFixed, show: true};
    // this.title.legend = legend;
    // this.title.combine = combine;
    // 图例的位置排序: 
    renderTitle () {
        var {
            text, 
            sort, 
            filter, 
            drag, 
            combineLayer,
            legend, 
            show,
            background
        } = this.title;
        var {nodeTextStyle, offset} = this;
        var {x, y, width, height} = this.layout.title || {};
        var node_x = this.layout.node.x;
        var layer_grid = this.layout.grid;
        var grid_right_position = layer_grid.x + layer_grid.width;
        var stackWidth = 0,
            defaultMargin = 10,
            currentTextWidth = 0,
            sysFontFamily = getSysFont(''),
            fontSize = 12,
            curBlockX,
            curBlockY,
            curBlockWidth,
            curBlockHeight;

        var title_click_area = [];
        // 先擦除再绘制
        this.canvas2DContext.clearRect(x, y, width, height);

        // 标题的背景:
        if (background) {
            fillRect(
                this.canvas2DContext,
                x,
                y,
                width,
                height,
                background
            )
        }
        if (this.direction === 'horizontal') {

            // 筛选
            if (this.title.filter && this.title.filter.show) {
                fillText(
                    this.canvas2DContext,
                    node_x, 
                    y + height / 2,
                    '筛选',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('筛选', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                stackWidth = node_x + currentTextWidth + defaultMargin;

                curBlockX = node_x;
                curBlockY = y + height / 2 - 6;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    // name: '筛选',
                    name: 'filter_' + this.uid + ':filterNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
            }

            // 排序
            if (this.title.sort && this.title.sort.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + height / 2,
                    '排序',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: 12 })
                );
                currentTextWidth = calcTextWidth('排序', '12px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + height / 2 - 6;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':sortNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }

            // 节点合并
            if (this.title.combine && this.title.combine.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + height / 2,
                    '节点合并',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: 12 })
                );
                currentTextWidth = calcTextWidth('节点合并', '12px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + height / 2 - 6;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':combineNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }
            // 居中位置
            // 图标题
            text && text.show && fillText(
                this.canvas2DContext,
                layer_grid.x + layer_grid.width / 2, 
                y + height / 2,
                text.text || '',
                Object.assign({}, text, { align: 'center', verticle: 'middle', fontSize: text.fontSize || 14 })
            );

            // 锁定
            if (this.title.drag && this.title.drag.show) {
                fillText(
                    this.canvas2DContext,
                    grid_right_position,
                    y + height / 2,
                    '锁定',
                    Object.assign({}, { align: 'right', verticle: 'middle', fontSize: 12 })
                );
                currentTextWidth = calcTextWidth('锁定', '12px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = grid_right_position - currentTextWidth;
                curBlockY = y + height / 2 - 6;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':lockLayer:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = currentTextWidth + defaultMargin;
            } else {
                stackWidth = 0;
            }

            // 合并
            if (this.title.combineLayer && this.title.combineLayer.show) {
                fillText(
                    this.canvas2DContext,
                    grid_right_position - stackWidth,
                    y + height / 2,
                    '图层合并',
                    Object.assign({}, { align: 'right', verticle: 'middle', fontSize: 12 })
                );
                currentTextWidth = calcTextWidth('图层合并', '12px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = grid_right_position - stackWidth - currentTextWidth;
                curBlockY = y + height / 2 - 6;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':combineLayer:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }

            // 图层
            // 颜色和文本, 块:
            if (this.title.legend && this.title.legend.show) {
                var itemMargin = legend.itemMargin || 10;
                var textMargin = legend.textMargin || 2;
                var itemWidth = legend.itemWidth || 14;
                var itemHeight = legend.itemHeight || 8;
                var colors = legend.color || this.colors;
                var len = legend.data.length;
                
                var txt = '',
                    cateTxt = '',
                    color,
                    text_y,
                    icon_y,
                    clickArea_y,
                    clickArea_height,
                    fontSize = 12,
                    formatter = legend.formatter,
                    legendStates = this.legendStates,
                    legendArea = {};
                // 顺序从右往左排列了, 这个影响不大
                for (var i = 0; i < len; i++) {
                    if (typeof formatter === 'function') {
                        txt = formatter(legend.data[i], legend);
                        cateTxt = legend.data[i];
                        color = this.themeConfig[legend.data[i]].theme;
                    } else {
                        txt = typeof legend.data[i] === 'string' ? legend.data[i] : legend.data[i].text || '';
                        cateTxt = txt;
                        color = !txt ? getColor() : this.themeConfig[txt].theme;
                    }
                    color = legendStates[cateTxt] ? color : this.themeConfig[cateTxt]['cancelColor'];
                    // color = typeof legend.data[i] === 'string' ? colors[i] : legend.data[i].color || colors[i];
                    
                    legendArea[cateTxt] = {};
                    text_y = y + height / 2 - fontSize/2;
                    icon_y = y + height / 2 - itemHeight/2;

                    fillText(
                        this.canvas2DContext,
                        grid_right_position - stackWidth,
                        y + height / 2,
                        txt,
                        Object.assign({}, { align: 'right', verticle: 'middle', fontSize: fontSize })
                    );
                    legendArea[cateTxt].text = {
                        x: grid_right_position - stackWidth,
                        y: y + height / 2,
                        text: txt,
                        textStyle: Object.assign({}, { align: 'right', verticle: 'middle', fontSize: fontSize })
                    }
                    currentTextWidth = calcTextWidth(txt, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                    fillRect(
                        this.canvas2DContext,
                        grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        icon_y,
                        itemWidth,
                        itemHeight,
                        color,
                        null,
                        2
                    );
                    legendArea[cateTxt].indicator = {
                        x: grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        y: icon_y,
                        width: itemWidth,
                        height: itemHeight,
                        background: color,
                        border: null,
                        borderRadiu: 2
                    }

                    clickArea_y = text_y > icon_y ? icon_y : text_y;
                    clickArea_height = itemHeight > fontSize ? itemHeight : fontSize;
                    
                    title_click_area.push({
                        name: 'legend_' + this.uid + ':legendChange:' + cateTxt,
                        x: grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        y: clickArea_y,
                        width: itemWidth + textMargin + currentTextWidth,
                        height: clickArea_height
                    });
                    stackWidth = stackWidth + currentTextWidth + itemMargin + itemWidth + textMargin;
                }
            }
            // 更新可点击区域信息;
            this.registerBlocks = title_click_area;
            this.legendBlocks = legendArea;
        } else {

            // 上下分层: 标题居左, 图层靠右; 上下间距对称
            
            var text_fontSize_default = 12;
            var text_padding_top = (height - (text && text.fontSize ? text.fontSize || 14 : 0) - text_fontSize_default) / 3;
            var node_padding_left = nodeTextStyle.padding.left,
                node_padding_right = nodeTextStyle.padding.right,
                grid_offset_left = offset.left,
                grid_offset_right = offset.right,
                padding_left,
                padding_right;
            padding_left = node_padding_left > grid_offset_left ? node_padding_left : grid_offset_left;
            padding_right = node_padding_right > grid_offset_right ? node_padding_right : grid_offset_right;

            var level1TextHeight = text && text.fontSize ? text.fontSize || 14 : 0;
            // 图标题
            text && text.show && fillText(
                this.canvas2DContext,
                layer_grid.x + padding_left, 
                y + text_padding_top + level1TextHeight / 2,
                text.text || '',
                Object.assign({}, text, { align: 'left', verticle: 'middle', fontSize: text.fontSize || 14 })
            );

            // 图层
            // 颜色和文本, 块:
            if (this.title.legend && this.title.legend.show) {
                var itemMargin = legend.itemMargin || 10;
                var textMargin = legend.textMargin || 2;
                var itemWidth = legend.itemWidth || 14;
                var itemHeight = legend.itemHeight || 8;
                var grid_right_position = x + width - padding_right;
                var colors = legend.color || this.colors;
                var len = legend.data.length;
                var stackWidth = 0;
                var txt = '',
                    cateTxt = '',
                    color,
                    text_y,
                    icon_y,
                    clickArea_y,
                    clickArea_height,
                    fontSize = 12,
                    formatter = legend.formatter,
                    legendStates = this.legendStates,
                    legendArea = {};
                // 顺序从右往左排列了, 这个影响不大
                for (var i = 0; i < len; i++) {
                    if (typeof formatter === 'function') {
                        txt = formatter(legend.data[i], legend);
                        cateTxt = legend.data[i];
                        color = this.themeConfig[legend.data[i]].theme;
                    } else {
                        txt = typeof legend.data[i] === 'string' ? legend.data[i] : legend.data[i].text || '';
                        cateTxt = txt;
                        color = !txt ? getColor() : this.themeConfig[txt].theme;
                    }
                    color = legendStates[cateTxt] ? color : this.themeConfig[cateTxt]['cancelColor'];
                    // color = typeof legend.data[i] === 'string' ? colors[i] : legend.data[i].color || colors[i];
                    
                    legendArea[cateTxt] = {}
                    text_y = y + text_padding_top + fontSize/2 + (level1TextHeight - fontSize)/2;
                    icon_y = y + text_padding_top + (level1TextHeight - itemHeight)/2;

                    fillText(
                        this.canvas2DContext,
                        grid_right_position - stackWidth,
                        text_y,
                        txt,
                        Object.assign({}, { align: 'right', verticle: 'middle', fontSize: fontSize })
                    );
                    legendArea[cateTxt].text = {
                        x: grid_right_position - stackWidth,
                        y: text_y,
                        text: txt,
                        textStyle: Object.assign({}, { align: 'right', verticle: 'middle', fontSize: fontSize })
                    }
                    currentTextWidth = calcTextWidth(txt, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                    fillRect(
                        this.canvas2DContext,
                        grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        icon_y,
                        itemWidth,
                        itemHeight,
                        color,
                        null,
                        2
                    );
                    legendArea[cateTxt].indicator = {
                        x: grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        y: icon_y,
                        width: itemWidth,
                        height: itemHeight,
                        background: color,
                        border: null,
                        borderRadiu: 2
                    }
                    
                    clickArea_y = text_y > icon_y ? icon_y : text_y;
                    clickArea_height = itemHeight > fontSize ? itemHeight : fontSize;

                    title_click_area.push({
                        name: 'legend_' + this.uid + ':legendChange:' + cateTxt,
                        x: grid_right_position - stackWidth - currentTextWidth - textMargin - itemWidth,
                        y: clickArea_y,
                        width: itemWidth + textMargin + currentTextWidth,
                        height: clickArea_height
                    });
                    stackWidth = stackWidth + currentTextWidth + itemMargin + itemWidth + textMargin;
                }

                this.legendBlocks = legendArea;
            }
            /********************* 第二层 ***************************/
            
            // 筛选
            if (this.title.filter && this.title.filter.show) {
                fillText(
                    this.canvas2DContext,
                    node_x + padding_left,
                    y + text_padding_top + level1TextHeight + text_padding_top + fontSize / 2,
                    '筛选',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('筛选', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = node_x + padding_left;
                curBlockY = y + text_padding_top + level1TextHeight + text_padding_top;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':filterNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = node_x + padding_left + currentTextWidth + defaultMargin;
            }
            // 排序
            if (this.title.sort && this.title.sort.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + text_padding_top + level1TextHeight + text_padding_top + fontSize / 2,
                    '排序',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('排序', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + text_padding_top + level1TextHeight + text_padding_top;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':sortNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }

            // 节点合并
            if (this.title.combine && this.title.combine.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + text_padding_top + level1TextHeight + text_padding_top + fontSize / 2,
                    '节点合并',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('节点合并', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + text_padding_top + level1TextHeight + text_padding_top;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':combineNodes:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }
            

            // 锁定
            if (this.title.drag && this.title.drag.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + text_padding_top + level1TextHeight + text_padding_top + fontSize / 2,
                    '锁定',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('锁定', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + text_padding_top + level1TextHeight + text_padding_top;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':lockLayer:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }

            // 图层合并
            if (this.title.combineLayer && this.title.combineLayer.show) {
                fillText(
                    this.canvas2DContext,
                    stackWidth, 
                    y + text_padding_top + level1TextHeight + text_padding_top + fontSize / 2,
                    '图层合并',
                    Object.assign({}, { align: 'left', verticle: 'middle', fontSize: fontSize })
                );
                currentTextWidth = calcTextWidth('图层合并', fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                curBlockX = stackWidth;
                curBlockY = y + text_padding_top + level1TextHeight + text_padding_top;
                curBlockWidth = currentTextWidth;
                curBlockHeight = fontSize;
                title_click_area.push({
                    name: 'filter_' + this.uid + ':combineLayer:' + this.uid + ':' + `${curBlockX},${curBlockY},${curBlockWidth},${curBlockHeight}`,
                    x: curBlockX,
                    y: curBlockY,
                    width: curBlockWidth,
                    height: curBlockHeight
                });
                stackWidth = stackWidth + currentTextWidth + defaultMargin;
            }
            // 更新可点击区域信息;
            this.registerBlocks = title_click_area;
        }
    }

    // 网格: 包含:
    renderGrid () {
        var { background, offset, direction } = this;
        var {x, y, width, height} = this.layout.grid;
        if (direction === 'horizontal') {
            fillRect(this.canvas2DContext, x + offset.left, y, width - offset.left - offset.right, height, background);
        } else {
            fillRect(this.canvas2DContext, x, y + offset.top, width, height - offset.top - offset.bottom, background);
        }
    }

    // 绘制节点拖动滑块
    // this.renderNodeTask = nodes;
    // this.renderNodeFilterValueRange = valueRange;
    // this.renderNodeValueRange = valueRange;
    // this.nodes
    // this.nodeSlider
    renderNodeSlider (nodes) {
        var renderNodes = nodes || this.nodes;
        var _canvasContext = this.canvas2DContext,
            layer_nodeSlider = this.layout.nodeSlider,
            _x = layer_nodeSlider.x,
            _y = layer_nodeSlider.y,
            _width = layer_nodeSlider.width,
            _height = layer_nodeSlider.height,
            _direction = this.direction,
            _nodeSlider = this.nodeSlider,
            _filterValueRange = this.renderNodeFilterValueRange,    // 筛选后的节点值范围, 没配置时默认以 cellWidth去计算索引位置""
            _renderNodeValueRange = this.renderNodeValueRange,      // 筛选后的节点值范围, 没配置时默认以 cellWidth去计算索引位置
            linearIndexWithPercent = linear([0, 100], _renderNodeValueRange);

        // 一个滑块的全部配置;
        var {show, position, sliderHeight, outer, inner, slider, resizerStyle} = _nodeSlider;
        var show = _nodeSlider.show,
            position = _nodeSlider.position || this.direction === 'horizontal' ? 'end' : 'inside',  // 节点起点位置 start, inside 节点与线条交汇处, end 线条末端
            sliderHeight = _nodeSlider.sliderHeight || 10,
            outer = _nodeSlider.outer || { background: 'rgba(255,255,255,0.3)', stroke: 'rgba(0,0,0,0.2)' },
            inner = _nodeSlider.inner || { background: 'rgba(0,0,0,0.3)' },
            resizerStyle = _nodeSlider.resizerStyle || { width: 4, height: 6, color: 'rgba(0,0,0,0)', position: 'center'},
            boundaryText = _nodeSlider.boundaryText || { show: false },
            startValue = linearIndexWithPercent.setY(_filterValueRange[0]),
            endValue = linearIndexWithPercent.setY(_filterValueRange[1]),
            min = _renderNodeValueRange[0],
            max = _renderNodeValueRange[1],
            direction = this.direction === 'horizontal' ? 'vertical' : 'horizontal',
            x, y, width, height; 

        if (!_nodeSlider.show) {
            return
        }

        this.erase(layer_nodeSlider);
        var dataZoomOption = {
            ...layer_nodeSlider,
            direction,
            sliderHeight,
            outer,
            inner,
            resizerStyle,
            boundaryText,
            startValue,
            endValue,
            min,
            max
        }
        if (this.dataZoomInstance) { 
            this.dataZoomInstance.update(dataZoomOption);
        } else {
            this.dataZoomInstance = new DataZoom(this.canvas2DContext, dataZoomOption, this.eventHandler, this.canvas);
            this.dataZoomInstance.init();
            this.dataZoomInstance.on('resize', this.updateRenderNodes);
            this.dataZoomInstance.on('moving', this.updateRenderNodes);
            this.dataZoomInstance.on('select', this.updateRenderNodes);
        };
    }

    updateRenderNodes = (desc, param) => {
        if (this.animation.updateRenderNodes) { cancelAnimationFrame(this.animation.updateRenderNodes) }
        this.animation.updateRenderNodes = requestAnimationFrame(()=>{
            var {value} = param;
            // this.erase();
            // this.createGrid();
            // this.renderGrid();
            // this.renderNodeSlider();
            var {node, grid} = this.layout;
            this.erase(node);
            this.erase(grid);
            this.filterNodeAndLinksByLegend();
            this.createNodeSliders({
                fieldKey: 'index',
                range: [Math.floor(value[0]), Math.ceil(value[1])]
            });
            this.createScaleNodes();
            this.renderGrid();
            this.renderNodes();
            this.nodeMarkHandler();
            this.renderLinks();
        }, 15);
    }

    renderNodes (nodes) {
        var t1 = Date.now();
        var renderNodes = nodes || this.renderNodeTask;
        var renderIsFunction = typeof this.nodeTextStyle.formatter === 'function' ? this.nodeTextStyle.formatter : null;

        // this.canvas2DContext.globalCompositeOperation = 'source-atop';
        var {x, y, width, height} = this.layout.node;
        var layer_node = this.layout.node;
        var layer_grid = this.layout.grid;
        var grid_width = layer_grid.width,
            grid_height = layer_grid.height,
            gird_x = layer_grid.x,
            grid_y = layer_grid.y;
    
        

        var _canvasContext = this.canvas2DContext,
            _x = layer_node.x,
            _y = layer_node.y,
            _width = layer_node.width,
            _height = layer_node.height,
            _padding = this.padding,
            _offset = this.offset,
            _nodeTextStyle = this.nodeTextStyle,
            _gridLineStyle = this.gridLineStyle,
            _isReverce = this.reverse,
            _maxAxisTextWidthOrHeight = this.maxAxisTextWidthOrHeight,
            _direction = this.direction,
            _linearScaleNodesWithIndex = this.linearScaleNodesWithIndex,
            _fieldkey_sourceType = '__sourceType',
            _fieldkey_nodeId = '__nodeId',
            _fieldkey_nodeText = '__text',
            highLightColor="red";// '__text' this.fieldKey_nodeText;

        var renderFn = null;
        var renderCount = 0;
        // 为节点添加标注
        var marks = [];
        var markAres = [];
        var stackTextHeiht = 0;

        this.erase({x: _x, y: _y, width: _width, height: _height});
        // this.nodes
        // 横向: 从上到下的绘图顺序
        if (_direction === 'horizontal') {
            if (_nodeTextStyle.background) {
                fillRect(
                    _canvasContext,
                    _x,
                    _y,
                    _width,
                    _height,
                    _nodeTextStyle.background
                )
            };

            stackTextHeiht = _y; //
            if (_isReverce) {
                stackTextHeiht = _y + _height; //  - _nodeTextStyle.padding.bottom
                renderFn = (node, index) => {

                    // var cy = _y + _titleHeight + _offset.top + _linearScaleNodesWithIndex.setX(index) + _padding.top;
                    var cy = _linearScaleNodesWithIndex.setX(index);
                    var txt = renderIsFunction ? renderIsFunction(node) : node[_fieldkey_nodeText];
    
                    // 增加对断行的支持: 如果范围内容中包括 \n|\t, 则认为文本需要断行显示: 注意, 这里并没有再去执行计算保证对齐;
                    var texts = txt.split(/[\n\t]/); // calcBreakWord(txt, this.maxAxisTextWidthOrHeight, this.nodeTextStyle.fontSize);
                    var baseLineHeight = _nodeTextStyle.lineHeight || _nodeTextStyle.fontSize * 1;
                    var ty,textHalfHeight, image, imageBeDrawed;
                    var sysFontFamily = getSysFont('');
                    var fontSize = _nodeTextStyle.fontSize || 12;
                    var text = '';
                    var textLimitWidth = 0;
                    var textWidth = 0;
                    for (var i = 0; i < texts.length; i++) {
                        ty = cy + i * baseLineHeight;
                        textHalfHeight = (_nodeTextStyle.fontSize || 12) / 2;
    
                        if (texts[i] && stackTextHeiht > ty + textHalfHeight) {
                            textLimitWidth = _width - _nodeTextStyle.padding.right - _nodeTextStyle.padding.left - (node[_fieldkey_sourceType] ? 3 : 0) - 10; // 某些情况下, 计算值仍然存在偏差, 因而增加一点边距；
                            text = ellipsisText(texts[i], textLimitWidth, fontSize + 'px ' + sysFontFamily, this.canvas2DContext, 2);
                            textWidth = calcTextWidth(text, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                            // 
                            fillText(
                                _canvasContext,
                                _x + _width - _nodeTextStyle.padding.right - (node[_fieldkey_sourceType] ? 3 : 0),
                                ty, 
                                text, // 
                                Object.assign({}, _nodeTextStyle, { align: 'right', verticle: 'middle' }, node.__layerCount > 1 ? {color: highLightColor} : null)
                            );

                            markAres.push({
                                id: node[_fieldkey_nodeId],
                                text: text,
                                x: _x + _width - _nodeTextStyle.padding.right - (node[_fieldkey_sourceType] ? 3 : 0) - textWidth,
                                y: ty - textHalfHeight,
                                width: textWidth,
                                height: _nodeTextStyle.fontSize || 12,
                                marks: []
                            });
                            stackTextHeiht = ty - textHalfHeight;
                            renderCount++;
                            
                            // console.log('绘制图标', _fieldkey_sourceType, node, node[_fieldkey_sourceType]);
                            if (node[_fieldkey_sourceType] && !imageBeDrawed) {
                                image = new Image();
                                image.src = sourceType_icons[node[_fieldkey_sourceType]];
                                _canvasContext.drawImage(
                                    image, 
                                    _x + _width - _nodeTextStyle.padding.right + 3,
                                    ty - textHalfHeight + 1,
                                    _nodeTextStyle.padding.right - 6,
                                    textHalfHeight * 2 - 2
                                );
                                imageBeDrawed = true;
                                // _canvasContext.drawImage(image, 33, 71, 104, 124, 21, 20, 87, 104);
                            }
                        }
                    }

                    
                    fillLine(
                        _canvasContext,
                        {x: gird_x, y: cy},
                        {x: gird_x + grid_width, y: cy}, //  - this.offset.right
                        {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                    );

                    cy = null;
                    txt = null;
                    texts = null;
                    baseLineHeight = null;
                    textHalfHeight = null;
                    ty = null;
                }
            } else {
                renderFn = (node, index) => {
                    
                    // var cy = _y + _titleHeight + _offset.top + _linearScaleNodesWithIndex.setX(index) + _padding.top;
                    var cy = _linearScaleNodesWithIndex.setX(index);
                    var txt = renderIsFunction ? renderIsFunction(node) : node[_fieldkey_nodeText];
    
                    // 增加对断行的支持: 如果范围内容中包括 \n|\t, 则认为文本需要断行显示: 注意, 这里并没有再去执行计算保证对齐;
                    var texts = txt.split(/[\n\t]/); // calcBreakWord(txt, this.maxAxisTextWidthOrHeight, this.nodeTextStyle.fontSize);
                    var baseLineHeight = _nodeTextStyle.lineHeight || _nodeTextStyle.fontSize * 1;
                    var sysFontFamily = getSysFont('');
                    var fontSize = _nodeTextStyle.fontSize || 12;
                    var textHalfHeight  = (_nodeTextStyle.fontSize || 12) / 2,
                        textLimitWidth = 0,
                        text = '',
                        textWidth = 0,
                        ty, image, imageBeDrawed;
                    for (var i = 0; i < texts.length; i++) {
                        ty = cy + i * baseLineHeight;
    
                        if (texts[i] && stackTextHeiht < ty - textHalfHeight) {
                            textLimitWidth = _width - _nodeTextStyle.padding.right - (node[_fieldkey_sourceType] ? 3 : 0) - 10; // 

                            text = ellipsisText(texts[i], textLimitWidth, fontSize + 'px ' + sysFontFamily, this.canvas2DContext, 2);
                            textWidth = calcTextWidth(text, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);

                            fillText(
                                _canvasContext,
                                _x + _width - _nodeTextStyle.padding.right,
                                ty, 
                                text, //  
                                Object.assign({}, _nodeTextStyle, { align: 'right', verticle: 'middle' }, node.__layerCount > 1 ? {color: highLightColor} : null)
                            );

                            markAres.push({
                                id: node[_fieldkey_nodeId],
                                text: text,
                                x: _x + _width - _nodeTextStyle.padding.right - textWidth,
                                y: ty - textHalfHeight,
                                width: textWidth,
                                height: _nodeTextStyle.fontSize || 12,
                                marks: []
                            });
                            stackTextHeiht = ty + textHalfHeight;
                            renderCount++;
                            
                            if (node[_fieldkey_sourceType] && !imageBeDrawed) {
                                image = new Image();
                                image.src = sourceType_icons[node[_fieldkey_sourceType]];
                                _canvasContext.drawImage(
                                    image, 
                                    _x + _width - _nodeTextStyle.padding.right + 3,
                                    ty - textHalfHeight + 1,
                                    _nodeTextStyle.padding.right - 6,
                                    textHalfHeight * 2 - 2
                                );
                                imageBeDrawed = true;
                                // _canvasContext.drawImage(image, 33, 71, 104, 124, 21, 20, 87, 104);
                            }
                        }
                    }
    
                    fillLine(
                        _canvasContext,
                        {x: gird_x, y: cy},
                        {x: gird_x + grid_width, y: cy}, //  - this.offset.right
                        {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                    );

                    cy = null;
                    txt = null;
                    texts = null;
                    baseLineHeight = null;
                    textHalfHeight = null;
                    ty = null;
                }
            }
        }
        // 纵向: 从左到右的绘图顺序 
        else { 
            if (_nodeTextStyle.background) {
                fillRect(
                    _canvasContext,
                    _x,
                    _y,
                    _width,
                    _height,
                    _nodeTextStyle.background
                )
            }
            // console.log('配置', _nodeTextStyle, _offset);
            var node_padding_top = _nodeTextStyle.padding.top,
                node_padding_bottom = _nodeTextStyle.padding.bottom,
                grid_offset_top = _offset.top,
                grid_offset_bottom = _offset.bottom,
                padding_left,
                padding_right;
            padding_left = node_padding_top > grid_offset_top ? node_padding_top : grid_offset_top;
            padding_right = node_padding_bottom > grid_offset_bottom ? node_padding_bottom : grid_offset_bottom;

            var minCellWidth = (_width - padding_left - padding_right) / (renderNodes.length + 1); // 35 || 
            var sysFontFamily = getSysFont('');
            stackTextHeiht = _x; //  + _nodeTextStyle.padding.left
            if (_isReverce) {
                stackTextHeiht = _x + _width; //  - _offset.right - _nodeTextStyle.padding.right
                renderFn = (node, index) => {
                    // index += spliceIndex * bufferSize;
                    // var cx = _x + _linearScaleNodesWithIndex.setX(index) + _offset.left + _padding.left;
                    var cx = _linearScaleNodesWithIndex.setX(index);
                    var  rTxt = renderIsFunction ? renderIsFunction(node) : node[_fieldkey_nodeText];
                    // var txt = minCellWidth < 20 ? '...' : rTxt.slice(0, (minCellWidth - 10) / (_nodeTextStyle.fontSize * 0.5));
                    // // var rotate = minCellWidth < 20;
                    // if (minCellWidth > 10 && txt.length < rTxt.length) {
                    //     txt += '...'
                    // };
                    var fontSize = _nodeTextStyle.fontSize || 12;
                    var txt = ellipsisText(rTxt, minCellWidth, fontSize + 'px ' + sysFontFamily, this.canvas2DContext, 2);
                    // var texts = calcBreakWord(txt, minCellWidth, _nodeTextStyle.fontSize);
                    var texts = {
                        1: txt,
                        length: 1
                    }
                    var textWidth = calcTextWidth(txt, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                    var baseLineHeight = _nodeTextStyle.lineHeight || _nodeTextStyle.fontSize * 1.5;
                    var textLen = texts.length;
                    var textHalfHeight = minCellWidth / 2,
                        cy;
    
                    for (var i = 1; i <= texts.length; i++) {
                        cy = _y + _height - textLen * baseLineHeight - _nodeTextStyle.padding.bottom;
    
                        textLen--;
                        if (texts[i] && stackTextHeiht > cx + textHalfHeight) {
                            fillText(
                                _canvasContext,
                                cx, 
                                cy, 
                                texts[i], 
                                Object.assign({}, _nodeTextStyle, { align: 'center', verticle: 'bottom' }, node.__layerCount > 1 ? {color: highLightColor} : null)
                            );

                            markAres.push({
                                id: node[_fieldkey_nodeId],
                                text: texts[i],
                                x: cx - textWidth / 2,
                                y: cy - fontSize,
                                width: textWidth,
                                height: fontSize,
                                marks: []
                            });
                            stackTextHeiht = cx - textHalfHeight;
                            renderCount++;
                        }
                        
                    }
                    
    
                    fillLine(
                        _canvasContext,
                        {x: cx, y: grid_y},
                        {x: cx, y: grid_y + grid_height}, //  - this.offset.bottom
                        {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                    );

                    cx = null;
                    rTxt = null;
                    txt = null;
                    texts = null;
                    baseLineHeight = null;
                    textLen = null;
                    textHalfHeight = null;
                    cy = null;
                };
            } else {
                renderFn = (node, index) => {
                    // index += spliceIndex * bufferSize;
                    // var cx = _x + _linearScaleNodesWithIndex.setX(index) + _offset.left + _padding.left;
                    var cx = _linearScaleNodesWithIndex.setX(index);
                    var  rTxt = renderIsFunction ? renderIsFunction(node) : node[_fieldkey_nodeText];
    
                    // var txt = minCellWidth < 10 ? '...' : rTxt.slice(0, (minCellWidth - 10) / (_nodeTextStyle.fontSize * 0.5));
    
                    // if (minCellWidth > 10 && txt.length < rTxt.length) {
                    //     txt += '...'
                    // };
                    var fontSize = _nodeTextStyle.fontSize || 12;
                    var sysFontFamily = getSysFont('');
                    var txt = ellipsisText(rTxt, minCellWidth, fontSize + 'px ' + sysFontFamily, this.canvas2DContext, 2);
                    var texts = {
                        1: txt,
                        length: 1
                    }
                    var textWidth = calcTextWidth(txt, fontSize + 'px ' + sysFontFamily, this.canvas2DContext);
                    // var texts = calcBreakWord(txt, minCellWidth, _nodeTextStyle.fontSize);
                    var baseLineHeight = _nodeTextStyle.lineHeight || _nodeTextStyle.fontSize * 1.5;
                    var textLen = texts.length;
                    var textHalfHeight = minCellWidth / 2,
                        cy;

                    for (var i = 1; i <= texts.length; i++) {
                        // cy = _y + _titleHeight + _maxAxisTextWidthOrHeight - textLen * baseLineHeight + _padding.top - _nodeTextStyle.padding.bottom;
                        cy = _y + _height - textLen * baseLineHeight - _nodeTextStyle.padding.bottom;
                        textLen--;
                        if (texts[i] && stackTextHeiht < cx - textHalfHeight) {
                            fillText(
                                _canvasContext,
                                cx, 
                                cy, 
                                texts[i], 
                                Object.assign({}, _nodeTextStyle, { align: 'center', verticle: 'bottom' }, node.__layerCount > 1 ? {color: highLightColor} : null)
                            );

                            markAres.push({
                                id: node[_fieldkey_nodeId],
                                text: texts[i],
                                x: cx - textWidth / 2,
                                y: cy - fontSize,
                                width: textWidth,
                                height: fontSize,
                                marks: []
                            });
                            stackTextHeiht = cx + textHalfHeight;
                            renderCount++;
                        }
                    }
                    
    
                    fillLine(
                        _canvasContext,
                        {x: cx, y: grid_y},
                        {x: cx, y: grid_y + grid_height}, //  - this.offset.bottom
                        {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                    );
                    cx = null;
                    rTxt = null;
                    txt = null;
                    texts = null;
                    baseLineHeight = null;
                    textLen = null;
                    textHalfHeight = null;
                    cy = null;
                };
            }
        }
        var t2 = Date.now();
        // console.log('初步设定不会要多久', t2 - t1);
        // renderFn && renderNodes.forEach(renderFn);
        if (renderFn) {
            var nodeLen = renderNodes.length;
            for (var i = 0; i < nodeLen; i++) {
                renderFn(renderNodes[i], i);
            }
            this.markAres = markAres;
        }
        if (_gridLineStyle.dash) {
            _canvasContext.setLineDash([]);
        }
        // console.log('文本计算最大宽高', this.maxAxisTextWidthOrHeight);
        renderNodes = null;
        renderIsFunction = null;
        // this.canvas2DContext.globalCompositeOperation = 'source-atop';
        // bufferSize = null;
        // spliceBigArray = null;   //
        _canvasContext = null
        _x = null;
        _y = null
        _width = null
        _height = null
        _padding = null
        _offset = null
        _nodeTextStyle = null
        _gridLineStyle = null
        _isReverce = null
        _maxAxisTextWidthOrHeight = null
        _direction = null
        _linearScaleNodesWithIndex = null
        _fieldkey_nodeText = null;// '__text' this.fieldKey_nodeText;
        renderFn = null;
        stackTextHeiht = null;
        nodeLen = null;
        var t3 = Date.now();
        // console.log('渲染节点所需时间', t3 - t2, t3 - t1, '节点数量', renderCount);
    }

    renderGridLines (nodes) {
        var renderNodes = nodes || this.renderNodeTask;
        var _linearScaleNodesWithIndex = this.linearScaleNodesWithIndex;
        var _canvasContext = this.canvas2DContext,
            _gridLineStyle = this.gridLineStyle,
            layer_grid = this.layout.grid,
            grid_x = layer_grid.x,
            grid_width = layer_grid.width,
            grid_y = layer_grid.y,
            grid_height = layer_grid.height;

        if (this.direction === 'horizontal') {
            renderNodes.forEach((node, index) => {
                var cy = _linearScaleNodesWithIndex.setX(index);
                fillLine(
                    _canvasContext,
                    {x: grid_x, y: cy},
                    {x: grid_x + grid_width, y: cy},
                    {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                );
            });
        } else {
            renderNodes.forEach((node, index) => {
                var cy = _linearScaleNodesWithIndex.setX(index);
                fillLine(
                    _canvasContext,
                    {x: cy, y: grid_y},
                    {x: cy, y: grid_y + grid_height},
                    {dash: _gridLineStyle.dash ? _gridLineStyle.dash : null, lineWidth: _gridLineStyle.lineWidth || 1, color: _gridLineStyle.color}
                );
            });
        } 
    }


    renderLinks () {
        var t1 = Date.now();
        var timeReader = this.timeReader || getDate;
        var renderLinks = this.renderLinkTask;
        var scalePercent = this.linearScalePercentWidthValue.setX;
        var renderedShapes = this.renderedLinkShape;
        renderedShapes.length = 0;

        var _canvasContext = this.canvas2DContext,
            _direction = this.direction,
            _linkLineStyle = this.linkLineStyle,
            _linearScaleTimeWithTimestamp = this.linearScaleTimeWithTimestamp,
            _linearScaleNodesWithIndex = this.linearScaleNodesWithIndex,
            _nodeIndexCache = this.nodeIndexCache,
            _fieldkey_from = '__from', // '__from' this.fieldkey_from,
            _fieldkey_to = '__to', // '__to' this.fieldkey_to,
            _fieldkey_timestamp = '__timestamp', // '__timestamp' this.fieldkey_timestamp,
            _fieldKey_seriesName = '__seriesName',
            _dateIsString = this.timestampIsString,
            _itemStyle = this.itemStyle,
            _themeConfig = this.themeConfig,
            renderFn;

        // this.links
        if (_direction === 'horizontal') {
            renderFn = (link, index) => {
                // 如果是文本
                var x = 0,
                    isTargetBigger;
                // 如果值有问题导致异常, 那么默认归位到 0
                if (_dateIsString) {
                    x = _linearScaleTimeWithTimestamp.setX(timeReader(link[_fieldkey_timestamp]) || scalePercent(0));
                } else {
                    x = _linearScaleTimeWithTimestamp.setX(link[_fieldkey_timestamp] || scalePercent(0) );
                }

                var y1_index = _nodeIndexCache[link[_fieldkey_from]]; // this.nodes.findIndex(_n => { return _n.id == link.from });
                var y2_index = _nodeIndexCache[link[_fieldkey_to]]; // this.nodes.findIndex(_n => { return _n.id == link.to });
                var pos_y2 = _linearScaleNodesWithIndex.setX(y2_index);
                var pos_y1 = _linearScaleNodesWithIndex.setX(y1_index);
                var seriesName = link[_fieldKey_seriesName];
                var theme = _themeConfig[seriesName];
                var item_line = theme.itemStyle.line.normal,
                    item_polygon = theme.itemStyle.polygon.normal,
                    item_circle = theme.itemStyle.circle.normal;

                if (y1_index !== -1 && y2_index !== -1) {
                    isTargetBigger = pos_y1 > pos_y2 ? false : true;

                    fillLine(
                        _canvasContext,
                        {x: x, y: pos_y1}, 
                        {x: x, y: isTargetBigger ? pos_y2 - item_polygon.size : pos_y2 + item_polygon.size},
                        {color: item_line.color || _linkLineStyle.color || '#fff', lineWidth: item_line.lineWidth || link.lineWidth || 1},
                        {
                            start: { 
                                size: item_circle.size, 
                                fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                stroke: item_circle.stroke, 
                                shape: 'circle'
                            },
                            end: { 
                                size: item_polygon.size, 
                                fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                stroke: item_polygon.stroke || null, 
                                shape: 'polygon', 
                                shapeSides: item_polygon.shapeSides||3, 
                                transform: isTargetBigger ? Math.PI : 0 
                            }
                        }
                    );
                    
                    renderedShapes.push([
                        {x: x, y: pos_y1},
                        {x: x, y: isTargetBigger ? pos_y2 - item_polygon.size : pos_y2 + item_polygon.size},
                        {
                            start: { 
                                size: item_circle.size, 
                                fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                stroke: item_circle.stroke, 
                                shape: 'circle'
                            },
                            end: { 
                                size: item_polygon.size, 
                                fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                stroke: item_polygon.stroke || null, 
                                shape: 'polygon', 
                                shapeSides: item_polygon.shapeSides||3, 
                                transform: isTargetBigger ? Math.PI : 0 
                            },
                            linkIndex: index
                        }
                    ]);
                }

                x = null;
                y1_index = null;
                y2_index = null;
                pos_y2 = null;
                pos_y1 = null;
                isTargetBigger = null;
                item_line = null;
                item_polygon = null;
                item_circle = null;
            };
        }
        // 纵向: 从左到右的绘图顺序 
        else {
            renderFn = (link, index) => {
                // 
                var y = 0;
                if (_dateIsString) {
                    y = _linearScaleTimeWithTimestamp.setX(timeReader(link[_fieldkey_timestamp]) || scalePercent(0));
                } else {
                    y = _linearScaleTimeWithTimestamp.setX(link[_fieldkey_timestamp] || scalePercent(0));
                }

                var x1_index = _nodeIndexCache[link[_fieldkey_from]]; // this.nodes.findIndex(_n => { return _n.id == link.from });
                var x2_index = _nodeIndexCache[link[_fieldkey_to]]; // this.nodes.findIndex(_n => { return _n.id == link.to });
                var pos_x1 = _linearScaleNodesWithIndex.setX(x1_index);
                var pos_x2 = _linearScaleNodesWithIndex.setX(x2_index);
                var seriesName = link[_fieldKey_seriesName];
                var theme = _themeConfig[seriesName];
                var item_line = theme.itemStyle.line.normal,
                    item_polygon = theme.itemStyle.polygon.normal,
                    item_circle = theme.itemStyle.circle.normal;

                if (x1_index !== -1 && x2_index !== -1) {
                    var isTargetBigger = pos_x1 > pos_x2 ? false : true;
                    fillLine(
                        this.canvas2DContext,
                        {x: pos_x1, y: y}, 
                        {x: isTargetBigger ? pos_x2 - item_polygon.size : pos_x2 + item_polygon.size, y: y},
                        {color: item_line.color || _linkLineStyle.color || '#fff', lineWidth: item_line.lineWidth || link.lineWidth || 1},
                        {
                            start: { 
                                size: item_circle.size, 
                                fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                stroke: item_circle.stroke, 
                                shape: 'circle'
                            },
                            end: { 
                                size: item_polygon.size, 
                                fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                stroke: item_polygon.stroke || null, 
                                shape: 'polygon', 
                                shapeSides: item_polygon.shapeSides||3, 
                                transform: isTargetBigger ? Math.PI/2 : -Math.PI/2 
                            }
                        }
                    );
                    
                    renderedShapes.push([
                        {x: pos_x1, y: y}, 
                        {x: isTargetBigger ? pos_x2 - item_polygon.size : pos_x2 + item_polygon.size, y: y},
                        {
                            start: { 
                                size: item_circle.size, 
                                fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                stroke: item_circle.stroke, 
                                shape: 'circle'
                            },
                            end: { 
                                size: item_polygon.size, 
                                fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                stroke: item_polygon.stroke || null, 
                                shape: 'polygon', 
                                shapeSides: item_polygon.shapeSides||3, 
                                transform: isTargetBigger ? Math.PI/2 : -Math.PI/2 
                            },
                            linkIndex: index
                        }
                    ]);
                }
                y = null;
                x1_index = null;
                x2_index = null;
                pos_x2 = null;
                pos_x1 = null;
                isTargetBigger = null;
                item_line = null;
                item_polygon = null;
                item_circle = null;
            };
        }

        var t2 = Date.now();
        // renderFn && renderLinks.forEach(renderFn);
        var linkLen = renderLinks.length;
        for (var i = 0; i < linkLen; i++) {
            renderFn(renderLinks[i], i);
        }
        var t3 = Date.now()
        timeReader = null;
        renderLinks = null;
        scalePercent = null;
        renderedShapes = null;
        _canvasContext = null;
        _direction = null;
        _linkLineStyle = null;
        _linearScaleTimeWithTimestamp = null;
        _linearScaleNodesWithIndex = null;
        _nodeIndexCache = null;
        _fieldkey_from = null;
        _fieldkey_to = null;
        _fieldkey_timestamp = null;
        _dateIsString = null;
        renderFn = null;
        // console.log('记录:渲染线条所需时间', t3 - t2, t3 - t2);
    }


    initEventHandler () {
        // console.log('为图例挂载事件, 尚缺乏缩放和拖动...');
        // this.eventHandler.removeEvent('mousemove', this.setHover);
        // this.eventHandler.removeEvent('mousewheel', this.scaleChart);
        // this.eventHandler.removeEvent('mousedown', this.saveGrid);
        this.eventHandler.addEvent('mousemove', this.setHover);
        // this.scaleChart.zIndex = 9;
        // this.eventHandler.addEvent('mousewheel', null, this.scaleChart);
        this.eventHandler.addEvent('mousedown', this.saveGrid);
    }

    setHover = (e, canvas) => {
        // 超出当前矩形块
        var point = {x: e.zrX, y: e.zrY};
        if (!isPointInBlock(point, this.layout.grid)) { 
            this.eventHandler.hideTips();
            return
        }

        if( this.animation.setHover ) {  cancelAnimationFrame(this.animation.setHover)};
        this.animation.setHover = requestAnimationFrame(
            ()=>{
                if (this.tooltip && this.tooltip.show) {
                    
                    var allNodes = this.findHover(e.zrX, e.zrY);
                    if (allNodes.length) {
                        var links = allNodes.map(saveIndex => {
                            return this.renderLinkTask[saveIndex]
                        });
                        
                        if (links.length) {
                            // this.hoveredImageDatas
                            this.hoveredImageDatas = true;
                            this.setHighLight(links);
                        }
                        var txt = '';
                        var getDate = this.timeReader;
                        var nodeIdWithTextCache = this.nodeIdWithTextCache;
                        if (typeof this.tooltip.formatter === 'function') {
                            // 链接线: links 信息, nodeId: 对应的文本信息: nodeIdWithTextCache 缓存对象
                            txt = this.tooltip.formatter(links, nodeIdWithTextCache);
                        } else {
                            try {
                                txt = links.map((link,index) => {
                                    return `<div style="margin-bottom:${index===links.length-1?0:5}px;">
                                                <p>文本: ${nodeIdWithTextCache[link.__from]} -> ${nodeIdWithTextCache[link.__to]}</p>
                                                <p>节点id: ${link.__from} -> ${link.__to}</p>
                                                <p>时间: ${formatDate(getDate(link.__timestamp), 'yyyy-MM-dd hh:mm:ss')}</p>
                                            </div>`
                                }).join('');
                            } catch (e) { console.warn('测试发现异常', e) };
                        };

                        this.eventHandler.setTipsContent(txt, e.zrX, e.zrY)
                    } else {
                        this.eventHandler.hideTips();
                        this.resetHightLight();
                        if (this.hoveredImageDatas) {
                            this.erase(this.layout.grid);
                            this.renderGrid();
                            this.renderGridLines();
                            this.renderLinks();
                        }
                    }
                    
                }
            }, 15); // 60fps
    }

    resetHightLight () {
        
        if (this.hoveredImageDatas) {
            this.canvas2DContext.shadowBlur = 0;
            this.canvas2DContext.shadowColor = 'transparent';
            this.canvas2DContext.shadowOffsetX = 0;
            this.canvas2DContext.shadowOffsetY = 0;
            this.hoveredLinks && this.hoveredLinks.forEach(link => {
                delete link._isHovered;
            });
            // this.hoveredImageDatas.forEach(toPutImageData => {
            //     console.log('当前的', toPutImageData);
            //     this.canvas2DContext.clearRect(toPutImageData.x, toPutImageData.y, toPutImageData.imageData.width, toPutImageData.imageData.height);
            //     this.canvas2DContext.putImageData(toPutImageData.imageData, 70, 70);
            // });
            // this.hoveredImageDatas.length = 0;
        }
    }

    getImageData (shape) {
        if (shape.type === 'line') {
            var p1 = shape.p1;
            var p2 = shape.p2;
            var expandRadius = shape.expandRadius || 0; // 整个扩大, 类似于边距; border
            var canvasContext = this.canvas2DContext;
            var x,y,width,height;

            x = (p1[0] > p2[0] ? p2[0] : p1[0]) - expandRadius*2;
            y = (p1[1] > p2[1] ? p2[1] : p1[1]) - expandRadius*2;

            width = Math.abs(p2[0] - p1[0]) + expandRadius * 4;
            height = Math.abs(p2[1] - p1[1]) + expandRadius * 4;

            return {
                x: x ^ 0,
                y: y ^ 0,
                width: width ^ 1,
                height: height ^ 0,
                imageData: canvasContext.getImageData(x ^ 0, y ^ 0, width ^ 1, height)
            }
        }
    }

    // 设置线条的高亮
    setHighLight (links) {
        // this.canvas2DContext.globalCompositeOperation = 'source-atop';
        this.canvas2DContext.save();
        
        var firstLink = getFirst(links);
        if (firstLink['__seriesName']) {
            var seriesName = firstLink['__seriesName'];
            var item_shadow = this.themeConfig[seriesName].itemStyle.shadow;
            this.canvas2DContext.shadowColor = item_shadow && item_shadow.color || 'rgba(0,0,0,0.2)';
            this.canvas2DContext.shadowBlur = item_shadow && item_shadow.shadowBlur == undefined ? 3 : +item_shadow.shadowBlur || 0;
            this.canvas2DContext.shadowOffsetX = item_shadow && item_shadow.shadowOffsetX || 1;
            this.canvas2DContext.shadowOffsetY = item_shadow && item_shadow.shadowOffsetY || 0;
        }
        
        links.forEach(link => {
            // 如果是文本
            var x = 0,
                isTargetBigger,
                _fieldkey_from = '__from',
                _fieldkey_to = '__to',
                _fieldkey_timestamp = '__timestamp',
                _fieldKey_seriesName = '__seriesName',
                _linkLineStyle = this.linkLineStyle,
                _themeConfig = this.themeConfig,
                scalePercent = this.linearScalePercentWidthValue.setX,
                timeReader = this.timeReader || getDate,
                _nodeIndexCache = this.nodeIndexCache,
                _linearScaleTimeWithTimestamp = this.linearScaleTimeWithTimestamp,
                _linearScaleNodesWithIndex = this.linearScaleNodesWithIndex;

            // 如果值有问题导致异常, 那么默认归位到 0
            if (this.timestampIsString) {
                x = _linearScaleTimeWithTimestamp.setX(timeReader(link[_fieldkey_timestamp]) || scalePercent(0));
            } else {
                x = _linearScaleTimeWithTimestamp.setX(link[_fieldkey_timestamp] || scalePercent(0) );
            }

            var y1_index = _nodeIndexCache[link[_fieldkey_from]]; // this.nodes.findIndex(_n => { return _n.id == link.from });
            var y2_index = _nodeIndexCache[link[_fieldkey_to]]; // this.nodes.findIndex(_n => { return _n.id == link.to });
            var pos_y2 = _linearScaleNodesWithIndex.setX(y2_index);
            var pos_y1 = _linearScaleNodesWithIndex.setX(y1_index);
            var seriesName = link[_fieldKey_seriesName];
            var theme = _themeConfig[seriesName];
            var item_line = theme.itemStyle.line.emphasis,
                item_polygon = theme.itemStyle.polygon.emphasis,
                item_circle = theme.itemStyle.circle.emphasis;

            if (y1_index !== -1 && y2_index !== -1) {
                isTargetBigger = pos_y1 > pos_y2 ? false : true;

                if (!link._isHovered) {
                    if (this.direction === 'horizontal') {
                        fillLine(
                            this.canvas2DContext,
                            {x: x, y: pos_y1}, 
                            {x: x, y: isTargetBigger ? pos_y2 - item_polygon.size : pos_y2 + item_polygon.size},
                            {color: item_line.color || _linkLineStyle.color || '#fff', lineWidth: item_line.lineWidth || link.lineWidth || 1},
                            {
                                start: { 
                                    size: item_circle.size, 
                                    fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                    stroke: item_circle.stroke, 
                                    shape: 'circle'
                                },
                                end: { 
                                    size: item_polygon.size, 
                                    fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                    stroke: item_polygon.stroke || null, 
                                    shape: 'polygon', 
                                    shapeSides: item_polygon.shapeSides||3, 
                                    transform: isTargetBigger ? Math.PI : 0
                                },
                            }
                        );
                    } else {
                        fillLine(
                            this.canvas2DContext,
                            {x: pos_y1, y: x}, 
                            {x: isTargetBigger ? pos_y2 - item_polygon.size : pos_y2 + item_polygon.size, y: x},
                            {color: item_line.color || _linkLineStyle.color || '#fff', lineWidth: item_line.lineWidth || link.lineWidth || 1},
                            {
                                start: { 
                                    size: item_circle.size, 
                                    fill: item_circle.color || _linkLineStyle.color || '#fff', 
                                    stroke: item_circle.stroke, 
                                    shape: 'circle'
                                },
                                end: { 
                                    size: item_polygon.size, 
                                    fill: item_polygon.color || _linkLineStyle.color || '#fff', 
                                    stroke: item_polygon.stroke || null, 
                                    shape: 'polygon', 
                                    shapeSides: item_polygon.shapeSides||3, 
                                    transform: isTargetBigger ? Math.PI/2 : -Math.PI/2
                                },
                            }
                        );
                    }
                    link._isHovered = true;
                }
            }
        });
        this.hoveredLinks = links;
        this.canvas2DContext.restore();
    }

    // 创建一个虚拟路径
    isPointInCircle ({centerPointX, centerPointY, radius}, {pointX, pointY}) {
        var _context = this.canvas2DContext;
        _context.beginPath();
        _context.arc(centerPointX, centerPointY, radius, 0, 2*Math.PI, false);
        _context.closePath();
        return _context.isPointInPath(pointX, pointY);
    }

    isPointInPolygon ({centerPointX, centerPointY, shapeSides, size, deg}, {pointX, pointY}) {
        var _context = this.canvas2DContext;
        var polygon = new Polygon(
            centerPointX, 
            centerPointY, 
            size, 
            shapeSides, 
            deg
        );
        polygon.createPath(_context, true);
        return _context.isPointInPath(pointX, pointY);
    }

    saveGrid = (e, canvas, data) => {
        
        this.transform.x = e.zrX;
        this.transform.y = e.zrY;

        var point = {x: e.zrX, y: e.zrY};
        if (!isPointInBlock(point, this.layout.grid)) { 
            // this.clearMove();
            return
        }

        // this.eventHandler.removeEvent('mousemove', this.moveGrid);
        // this.eventHandler.removeEvent('mouseup', this.clearMove)
        this.eventHandler.addEvent('mousemove', this.moveGrid);
        this.eventHandler.addEvent('mouseup', this.clearMove);
        
    }

    moveGrid = (e, canvas, data) => {
        noevent(e);

        var newPos = {
            x: e.zrX,
            y: e.zrY
        };

        if (this.animation.scrollHandler) { 
            // console.log('执行多次');
            cancelAnimationFrame(this.animation.scrollHandler);
        };
        this.animation.scrollHandler = requestAnimationFrame(()=>{
            // console.log('执行一次...');
            // var scalePercent = this.linearScalePercentWidthValue.setX;
            // this.linearScaleTimeWithTimestamp = linear([scalePercent(this.startPercent), scalePercent(this.endPercent)], [0, width]);
            // _x + _maxAxisTextWidthOrHeight + _offset.left + _boundary.left + (_linearScaleTimeWithTimestamp.setX(timeReader(link[_fieldkey_timestamp])) || 0) + _padding.left;
            var readKey = this.direction === 'horizontal' ? 'x' : 'y';
            // var oldValue = this.linearScalePercentWidthValue.setY(this.linearScaleTimeWithTimestamp.setY(newPos[readKey]));
            var oldValue = this.linearRenderPercentWithWidth.setY(this.transform[readKey]);
            // var newValue = this.linearScalePercentWidthValue.setY(this.linearScaleTimeWithTimestamp.setY(this.transform[readKey]));
            var newValue = this.linearRenderPercentWithWidth.setY(newPos[readKey]);

            var speed = Math.abs(newPos[readKey] - this.transform[readKey]) / this.layout.grid.width;
            var newPercent = {
                startValue: Math.abs(this.startPercent + (oldValue - newValue)*speed),
                endValue: Math.abs(this.endPercent + (oldValue - newValue)*speed)
            }

            if (newPercent.endValue - newPercent.startValue <= 0.005) {
                newPercent.endValue = newPercent.startValue + 0.005;
            }
            var _max = newPercent.endValue;
            if (newPercent.endValue <= newPercent.startValue) {
                newPercent.endValue = newPercent.startValue;
            } else if (newPercent.endValue >= 100){
                newPercent.endValue = 100;
            }
            if (newPercent.startValue >= _max) {
                newPercent.startValue = _max;
            } else if (newPercent.startValue <= 0) {
                newPercent.startValue = 0;
            }

            // this.transform.x = newPos.x;
            // this.transform.y = newPos.y;
            // console.log('查看位置的差值', newPos.x - this.transform.x);
            
            this.startPercent = newPercent.startValue;
            this.endPercent = newPercent.endValue;

            // this.erase();
            this.initTimeRange();
            this.createRenderNodesAndLinks(true);

            var {node, nodeSlider, grid} = this.layout;
            if (this.nodes.length === 0 && this.links.length === 0) {
                this.erase(node);
                this.erase(nodeSlider);
                this.renderedLinkShape.length = 0;
                this.errorHandler({
                    type: 'warn',
                    message: '无数据',
                    text: '无数据'
                }, grid);
                return;
            }
            this.filterNodeAndLinksByLegend();
            this.createNodeSliders();
            // this.calcMaxTextWidthOrHeight();
            this.createScaleNodes();
            this.createScaleTimes();

            this.renderedLinkShape.length = 0;
            this.erase(grid);
            this.renderGrid();

            this.renderLinks();
            // if (this.animation.renderTitle) { cancelAnimationFrame(this.animation.renderTitle) }; // setTimeout, cancelAnimationFrame
            // this.animation.renderTitle = requestAnimationFrame(()=>{
                !isBlokHidden(node) && (
                    this.renderNodes(),
                    this.nodeMarkHandler()
                );
                !isBlokHidden(nodeSlider) && this.renderNodeSlider();
            // }, 0);
        }, 16);
    }

    clearMove = (e, canvas, data) => {
        // console.log('清除....');
        this.eventHandler.removeEvent('mousemove', this.moveGrid);
        this.eventHandler.removeEvent('mouseup', this.clearMove);

        // this.transform.x = newPos.x;
        // this.transform.y = newPos.y;
    }


    // 缩放图形
    scaleChart = (e, canvas, data) => {
        this.transform.k += -e.deltaY * (e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002);
        // 超出当前矩形块
        var point = {x: e.zrX, y: e.zrY};
        
        if (isPointInBlock(point, this.grid)) {
            if (this.animation.scrollHandler) { cancelAnimationFrame(this.animation.scrollHandler) };
            this.animation.scrollHandler = requestAnimationFrame(()=>{
                // 如果鼠标是放置在某一个位置, 把该位置作为缩放的中心区域:
                // var scalePercent = this.linearScalePercentWidthValue.setX;
                // this.linearScaleTimeWithTimestamp = linear([scalePercent(this.startPercent), scalePercent(this.endPercent)], [0, width]);
                // _x + _maxAxisTextWidthOrHeight + _offset.left + _boundary.left + (_linearScaleTimeWithTimestamp.setX(timeReader(link[_fieldkey_timestamp])) || 0) + _padding.left;

                var mousePointPercent = this.linearRenderPercentWithWidth.setY(point.x);
                // console.log('鼠标落地所在的百分比位置', this.transform.k);
                var scaleK = this.transform.k;
                var referStartValue = this.startValue; // this.startPercent_cache;
                var referEndValue = this.endValue; // ;this.endPercent_cache;

                var scaleHelp = this.transformHelp;
                var newPercent = {
                    startValue: referStartValue,
                    endValue: referEndValue
                }
                var halfValue = newPercent.endValue - newPercent.startValue / 2;
                var mixValue = mousePointPercent;

                

                var speed = 0.2;
                // 要保证鼠标落点的值始终在视野范围中, 且缩放前后位置不变;
                // 缩放前 
                //  视野区间 [2, 13]    值 8, 
                // 缩放后
                //  视野区间 [2, 14]    值 8,
                // 
                // 所以问题的关键在于视野区间的算法: 只需要保证 值所处的比例相同, 那么值 8所处的位置就不会变动; 
                //  代入到问题: [referStartValue, referEndValue]    mousePointPercent
                // 新区间
                //             [newStartValue, endValue]    mousePointPercent
                // 通俗的来说
                //      10, 20,  16, 比例为 0.6
                //      n1, n2,  16,  
                // 那么就存在这样的关系: n1 = 16 - 0.6 * t;     => 代入到 10, 20, 得到 t = 10;
                //                     n2 = 16 + 0.4 * t;
                var rate = mousePointPercent / (newPercent.endValue - newPercent.startValue);

                // newPercent.startValue = mousePointPercent - rate/scaleK;
                // newPercent.endValue = mousePointPercent + rate/scaleK;
                var _k = scaleK;
                if (scaleHelp.k) {
                    _k = scaleK / scaleHelp.k;
                }
                // var newRange = (newPercent.endValue - newPercent.startValue) / _k;
                // newPercent.startValue = mousePointPercent - rate * newRange;
                // newPercent.endValue = mousePointPercent + (1 - rate) * newRange;
                newPercent.startValue += halfValue * speed * scaleK;
                newPercent.endValue -= halfValue * speed * scaleK;

                if (newPercent.startValue >= mixValue) {
                    // newPercent.startValue = mixValue;
                } else if (newPercent.startValue <= 0) {
                    newPercent.startValue = 0;
                }
                if (newPercent.endValue <= mixValue) {
                    // newPercent.endValue = mixValue;
                } else if (newPercent.endValue >= 100){
                    newPercent.endValue = 100;
                }
                // if (this.dataZoom.resizeToMaxAble === false || this.dataZoom.resizeable === false || this.dataZoom.resizeToMinAble === false) {
                    // newPercent.startValue = 
                    if (newPercent.endValue - newPercent.startValue >= referEndValue - referStartValue) {
                        this.transform.k = 1;
                        scaleHelp.k = 1;n 
                        // newPercent.endValue = newPercent.startValue + (_dataZoom.endValue - _dataZoom.startValue);
                        return
                    }
                // }

                this.startPercent = newPercent.startValue;
                this.endPercent = newPercent.endValue;
                scaleHelp.startValue = newPercent.startValue;
                scaleHelp.endValue = newPercent.endValue;
                scaleHelp.k = scaleK;

                // console.log('查看, 新的百分比', this.startPercent, this.endPercent);
                this.erase();
                this.initTimeRange();

                if (this.animation.renderTitle) { cancelAnimationFrame(this.animation.renderTitle) }
                this.animation.renderTitle = requestAnimationFrame(
                    ()=>{
                        // this.createTitle();
                        this.renderTitle();
                    }, 16);

                // if (this.animation.renderContent) { cancelAnimationFrame(this.animation.renderContent) }
                // this.animation.renderContent = requestAnimationFrame(
                //     ()=>{
                        this.createRenderNodesAndLinks(true);

                        if (this.nodes.length === 0 && this.links.length === 0) {
                            this.createGrid();
                            this.errorHandler({
                                type: 'warn',
                                message: '无数据',
                                text: '无数据'
                            });
                            return;
                        }


                        this.calcMaxTextWidthOrHeight();
                        this.filterNodeAndLinksByLegend();
                        this.createNodeSliders();
                        this.createScaleNodes();
                        this.createScaleTimes();
                        this.createGrid();
                        this.renderGrid();

                        // if (this.animation.renderNodes) { cancelAnimationFrame(this.animation.renderNodes) };
                        // this.animation.renderNodes = requestAnimationFrame(
                        //     ()=>{
                                var tNodeStart = Date.now();
                                this.renderNodeSlider();
                                this.renderNodes();
                                this.nodeMarkHandler();
                                var tNode = Date.now();
                                // console.log('记录:绘制坐标文本时间节点', tNode - tNodeStart, tNode - t1);
                            // }, 0);
                        
                        // if (this.animation.renderLinks) { cancelAnimationFrame(this.animation.renderLinks) };
                        // this.animation.renderLinks = requestAnimationFrame(
                            // ()=>{
                                var tLinkStart = Date.now();
                                this.renderLinks();
                                var tLink = Date.now();
                                // console.log('记录:绘制线条时间节点', tLink - tLinkStart, tLink - t1);
                            // }, 15);
                    // }, 0);
            }, 16);
            return true;
        };
    }

    setPointStyleHandler () {
        if (this.animation.setPoint) { cancelAnimationFrame(this.animation.setPoint) };
        this.animation.setPoint = requestAnimationFrame(() => {
            var resizeStyle = this.direction === 'horizontal' ? 'e-resize' : 'n-resize';
            var pointStyle = {
                outer: 'pointer',
                inner: resizeStyle,
                resizeRight: resizeStyle,
                resizeLeft: resizeStyle
            }
            var zIndex = {
                outer: 1,
                inner: 2,
                resizeRight: 2,
                resizeLeft: 2
            }

            if (this.once) {
                for (var key in this.shapes) {
                    var {x, y, width, height} = this.shapes[key];
                    this.eventManager.registerEventStyleInBlockModel({
                        id: 'timeline-dataZoom-' + key,
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
                    this.eventManager.updateRegisterBlock('timeline-dataZoom-' + key, {
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
            
        }, 0);
    }


    mergeOptions (list, options) {
        var res = deepCopy(list || []);
        if (options && options.length) {
            options.forEach(opt => {
                if (!arrayHas(res, opt)) {
                    res.push({...opt});
                }
            })
        }
        return res
    }

    // 根据一个传入的 x|y 值, 找出位置所在的所有链接线对象
    findHover (x, y) {
        // 扩散半径 = /圆心宽/三角箭头宽
        var expandRadius = 5;
        var inArea = [];
        var basePos = 0;
        var getDate = (v) => this.timestampIsString ? this.timeReader(v) : v;
        
        var t1 = Date.now();
        if (this.direction === 'horizontal') {

            // 依赖构造出的渲染线条, 在渲染出来的形状中, 去匹配筛选以尽量减少匹配的数量复炸度
            this.renderedLinkShape.forEach(shapeDetail => {
                var [pos1, pos2, ends] = shapeDetail;

                var lnkX1 = pos1.x;
                var lnkX2 = pos2.x;

                var lnkY1 = pos1.y;
                var lnkY2 = pos2.y;

                // 横向, 直接比较 x坐标是否邻近极值; expandRadius === Math.max.apply(null, [ends.start.size, ends.end.size]);
                if (isMixed([x - expandRadius, x + expandRadius], [lnkX1, lnkX1 + 1])) {

                    var isTargetBigger = lnkY2 > lnkY1; // ? pos_x2 - 5 : pos_x2 + 5
                    var zoomY = [isTargetBigger ? lnkY1 - 5 : lnkY1 + 5, isTargetBigger ? lnkY2 + 5 : lnkY2 - 5];
                    // 如果符合区间, 再匹配 y坐标是否趋于极值中
                    if (isInRange(y, zoomY)) {
                        // 如果两则都符合, 再判断鼠标点是否是在线条上: x坐标计算可能会有一定误差, 这里简单增加了一点范围, 这个数是随便写的并没有测试论证, 所以并不严谨
                        if (isInRange(x, [lnkX1 - 1.5, lnkX1 + 1.5])) {
                            inArea.push(ends.linkIndex);
                        } else {
                            // 如果不在线条, 优先判断是否在圆上, 再判断是否在多边形上
                            var isInCirclle = this.isPointInCircle({ 
                                centerPointX: lnkX1,
                                centerPointY: lnkY1,
                                radius: ends.start.size
                            }, {
                                pointX: x,
                                pointY: y
                            });

                            if (isInCirclle) {
                                inArea.push(ends.linkIndex);
                            } else {
                                var isInPolygon = this.isPointInPolygon({ 
                                    centerPointX: lnkX2,
                                    centerPointY: lnkY2,
                                    shapeSides: ends.end.shapeSides,
                                    size: ends.end.size,
                                    deg: ends.end.transform
                                }, {
                                    pointX: x,
                                    pointY: y
                                });

                                if (isInPolygon) {
                                    inArea.push(ends.linkIndex);
                                }
                            }
                        }
                    }
                }
            });

            var t2 = Date.now();
            // console.log('遍历找节点', t2 - t1);
            return inArea;
        } else {
            // 依赖构造出的渲染线条, 在渲染出来的形状中, 去匹配筛选以尽量减少匹配的数量复炸度
            this.renderedLinkShape.forEach(shapeDetail => {
                var [pos1, pos2, ends] = shapeDetail;

                var lnkX1 = pos1.x;
                var lnkX2 = pos2.x;

                var lnkY1 = pos1.y;
                var lnkY2 = pos2.y;
                // 纵向, 直接比较 y坐标是否邻近极值; expandRadius === Math.max.apply(null, [ends.start.size, ends.end.size]);
                if (isMixed([y - expandRadius , y + expandRadius ], [lnkY1, lnkY1 + 1])) {

                    var isTargetBigger = lnkX2 > lnkX1; // ? pos_x2 - 5 : pos_x2 + 5
                    var zoomX = [isTargetBigger ? lnkX1 - 5 : lnkX1 + 5, isTargetBigger ? lnkX2 + 5 : lnkX2 - 5];
                    // 如果符合区间, 再匹配 x坐标是否趋于极值中
                    if (isInRange(x, zoomX)) {

                        // 如果两则都符合, 再判断鼠标点是否是在线条上: y坐标计算可能会有一定误差, 这里简单增加了一点范围, 这个数是随便写的并没有测试论证, 所以并不严谨
                        if (isInRange(y, [lnkY1 - 1.5, lnkY1 + 1.5])) {
                            inArea.push(ends.linkIndex);
                        } else {
                            // 如果不在线条, 优先判断是否在圆上, 再判断是否在多边形上
                            var isInCirclle = this.isPointInCircle({ 
                                centerPointX: lnkX1,
                                centerPointY: lnkY1,
                                radius: ends.start.size
                            }, {
                                pointX: x,
                                pointY: y
                            });

                            if (isInCirclle) {
                                inArea.push(ends.linkIndex);
                            } else {
                                var isInPolygon = this.isPointInPolygon({ 
                                    centerPointX: lnkX2,
                                    centerPointY: lnkY2,
                                    shapeSides: ends.end.shapeSides,
                                    size: ends.end.size,
                                    deg: ends.end.transform
                                }, {
                                    pointX: x,
                                    pointY: y
                                });

                                if (isInPolygon) {
                                    inArea.push(ends.linkIndex);
                                }
                            }
                        }
                    }
                }
            });

            return inArea;
        }
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
        this.eventHandler.addEvent('timeline-' + eventType + this.uid, eventDesc, cb);

        eventType = 'timeline-' + eventType + this.uid;
        if (this.eventRecord.indexOf(eventType) !== -1) {
            this.eventRecord.push(eventType);
        }
    }

    // 派发事件
    emit (eventType, params, event) {
        this.eventHandler.dispatchEvent('timeline-' + eventType + this.uid, params, event);
    }

    filterDataByZIndex () {}

    // 合并图层
    mergeLayers (layers) {}

    // 抽取图层
    extractLayers (layers) {}

    // 导出某个图层数据到表格
    exportLayerToTable (layer) {}

    // 清除实例上挂载的所有事件, 动画
    clearAllEvent () {
        for (var key in this.animation) {
            if (this.animation[key]) { cancelAnimationFrame(this.animation[key]) }
        }

        if (this.eventHandler) {
            this.eventHandler.removeEvent('mousemove', this.setHover);
            // this.eventHandler.removeEvent('mousewheel', this.scaleChart);
            this.eventHandler.removeEvent('mousedown', this.saveGrid);
            this.eventHandler.removeEvent('mousemove', this.moveGrid);
            this.eventHandler.removeEvent('mouseup', this.clearMove);

            // this.eventHandler.removeEvent('click', this.legendChange);
            // this.eventHandler.removeEvent('click', this.filterNodes);
            // this.eventHandler.removeEvent('click', this.sortNodes);
            // this.eventHandler.removeEvent('click', this.combineNodes);
            // this.eventHandler.removeEvent('click', this.lockLayer)
            // this.eventHandler.removeEvent('click', this.combineLayer);

            this.removeRegisterBlock();

            for (var i = 0; i < this.eventRecord.length; i++ ) {
                this.eventManager.disposeAll(this.eventRecord[i]);
            };
        }
    }

    destroy () {
        this.clearAllEvent();

        if (this.dataZoomInstance) {
            this.dataZoomInstance.destroy && this.dataZoomInstance.destroy();
        }

        for (var key in this) {
            delete this[key]
        }
    }
}



export default TimeSeriesLine;

export {
    TimeSeriesLine,

}