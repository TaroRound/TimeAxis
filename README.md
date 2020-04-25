功能及使用说明:

脱离业务而言: 该组件旨在开发出一个适用于超大数据量下的, 按照某个顺序(记为顺序 ->A), 链接起止点的组件;
在当前系统中而言, 这个"某个顺序"指代的时间, 当然也可以按照其他字段来作为顺序的依据(这个值应该是一个数字), 比如链接的次数;

组件主要包含了几个大类:
1. components.Chart 类, 创建一个 canvas dom 对象, 以及基本的图例所拥有得属性/方法
2. components.DataZoom 类, 在一个 canvas.2d 绘图对象上, 创建一个可拖动,可缩放的滑块
3. components.MultiTimeAxis 类, 在一个 canvas.2d 绘图对象上, 创建一个一连串排列的文本
4. components.TimeSeriesLine 类, 在一个 canvas.2d 绘图对象上, 创建一个可拖动, 可缩放的序列连接图

针对系统业务, 创建的功能主类:
TimeStaticChart 这个类要做的, 依据业务以及 UI要求, 计算出各图例的布局, 颜色信息等, 然后在布局位置, 绘制对应的图例
    并在更新操作时, 组织好各图例之间的关联调用, 同步更改; 

为了超大数据量下达到更好的性能, 组件大量使用了异步操作, 以及缓存的使用, 在后面的扩展中也希望能首要考虑到性能


1. 大体思路;
    a. 初始绘制阶段:
        第一步要做的, 就是根据传入的配置参数, 创建出来基本的布局, 以及以上几个类所共同拥有的一些信息, 然后在布局位置 相应的创建以上几个类的实例
        这个共同信息, 个人实现的是一个共同的百分比位置, 以及一个共同的阈值(这个阈值从 ->A 中读取), 在当前系统中即为时间的最大最小值
            通过控制共同的百分比, 也即控制了多个图例所要渲染的数据

    b. 挂载事件阶段:
        在上一步初始绘制阶段, 也应该为相应图例挂载回调事件;
            如: DataZoom 类值改变的事件, TimeSeriesLine 线条点击, 悬停时的事件等;
        在这些回调事件中, DataZoom 类的值改变事件较为特殊:图例也应该关联更新;

        关联更新:
            DataZoom 回调事件中, 可以读取传入百分比信息; 然后改变 共同的百分比, 重新绘制 TimeSeriesLine, MultiTimeAxis 这两个图例;
            这一个过程会被大量的重复调用, 尤其是在超大量数据时, 需要尽量保证在 16ms内完成计算 + 绘制的过程; 也是因此性能要首要考虑;

    c. 更新阶段
        数据有修改时, 重新计算共同的阈值, 共同的百分比, 如果数据没有修改, 则不必重新计算这个共同的阈值;
        然后重新计算布局, 更新其他图例;
        这一个过程不会太过频繁, 对性能要求可以稍微降低; --主要目标在于保证程序的正确;

    d. 销毁阶段
        先销毁各图例的实例, 最后来销毁 TimeStaticChart 主类;

    关于事件:
        比如, 鼠标移入到某一个位置时, 需要把样式设置成可点击, 可拖动, 可缩放等; 在多个图例之中均会用到这些方法, 因此考虑封装一个事件代理类 eventProxy;
        对图例的所有操作, 比如 click, dblclick, mousewheel, mousedown, mouseup 等, 都应该可以通过 eventProxy来处理, 并且像 DataZoom 值改变这类 "自定义"
        事件也应该支持, 所以这个事件代理类应该至少要支持 dom MouseEvent类型事件, 也支持调用者自定义类型事件;


2. 特别注意:
    更新阶段时（数据有修改时）, TimeSeriesLine 应该销毁并重新实例化, 否则原实例的注册事件因为未被清除, 可能会导致图例操作异常;


3. 其他:
    a. 性能分析记录:
        目前该组件的性能瓶颈还是在于数据筛选, 以及渲染线条/文本的这一个过程, 初次渲染数据筛选消耗占比较大, 更新时由于缓存的建立渲染线条/文本这一过程占比较大, 
            数据筛选: 初始化时的数据筛选需要对所有图例都进行遍历筛选, 过滤出区间内的线条/节点; 
			            调用的 components.TimeSeriesLine.createRenderNodesAndLinks 方法, 因为系统中可能的合并分组, 遍历过程为所有节点额外创建了几个访问属性, 这一过程对性能影响很大
            渲染线条/文本: 当文本需要断行时, 断行算法支撑不起来性能, 渲染线条两端的园/三角形 也会非常影响性能;  

    b. 工具方法说明: 文件整理有些混乱, 且不少功能未实现, 比如动画
        
        animate 动画, 未实现的功能, 参照 tween.js
        shape 
            /line 绘制带端点的线条, 曲线的便捷方法;
            /point 点的实例
            /polygon  绘制多边形的便捷方法
            /rect     绘制支持阴影, 圆角矩形的便捷方法
            /text     绘制文本的便捷方法, 暂未实现竖排文本, 旋转文本 
        util.js 提供了其他一些基本方法
        lib 
            /core
                /curbe 提供了计算贝塞尔曲线 控制点的方法;


配置项示例:
   {
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
            position,               // 
            : 当图例方向为横向时, 有效值为 top, middle, bottom(默认); 方向为纵向时, 有效值为 left center right(默认);
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
        grid: {                     // 整体图例与 canvas 的边距, 仅支持具体的像素值, 不支持百分比
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
                    sort: {						// 节点的排序: 暂未实现的功能
                        show: boolean,
                        options: []
                    },
                    filter: {					// 节点的筛选和合并: 暂未实现的功能
                        show: boolean,
                        options: []
                    }
                },
                data: {             // 图例的数据
                    nodes: [],      // 节点
                    links: []       // 链接线
                }
            }
        ]
    }

