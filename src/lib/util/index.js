function returnFalse () {
    return false
}

function returnTrue() {
	return true;
}

function typeOf(input) {
    return ({}).toString.call(input).slice(8, -1).toLowerCase();
}

// 递归复制
function deepClone (input) {
    var output = input,
        type = typeOf(input),
        index, size;

    if (type === 'array') {
        output = [];
        size = input.length;

        for (index=0;index<size;++index){
            output[index] = deepClone(input[index]);
        }
    } else if (type === 'object') {
        output = {};

        for (index in input){
            output[index] = deepClone(input[index]);
        }
    }

    return output;
};

// 递归合并
function merge_recursive (base, extend) {
    if (typeOf(base) !== 'object') {
        return extend;
    }

    for (var key in extend) {
        if (typeOf(base[key]) === 'object' && typeOf(extend[key]) === 'object') {
            base[key] = merge_recursive(base[key], extend[key]);
        } else {
            base[key] = extend[key];
        }
    }

    return base;
}

// 对象合并
function merge (clone) {
	return npmMerge(clone === true, false, arguments);
}

// {param.clone} 是否创建一个新的合并对象
// {param.recursive} 是否递归合并
// {param.argv} 传入的对象列表
function npmMerge (clone, recursive, argv) {
    var result = argv[0],
        size = argv.length;

    if (clone || typeOf(result) !== 'object') {
        result = {};
    }

    for (var index=0;index<size;++index) {

        var item = argv[index],
            type = typeOf(item);

        if (type !== 'object') { continue };

        for (var key in item) {
            if (key === '__proto__') { continue };

            var sitem = clone ? deepClone(item[key]) : item[key];
            if (recursive) {
                result[key] = merge_recursive(result[key], sitem);
            } else {
                result[key] = sitem;
            }
        }
    }

    return result;
}

var getUUid = (function () {
    var n = 1000;
    return function () {
        n++;
        return n
    }
})();




/**
 ********************************** 设备平台相关 *************************************************
 **/
// 设备dpr
function getDevicePixelRatio () {
    var devicePixelRatio = 1;
    if (typeof window !== 'undefined') {
        devicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
    }
    return devicePixelRatio
}


// 全屏
function fullscreen(elem) {
    var docElm = elem || document.documentElement;
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
    } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
    } else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
    } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();  
    }
}
  
// 退出全屏
function exitFullscreen() {
    if (document.exitFullscreen) {  
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}


/**
 ********************************** 事件类 *************************************************
 * 参考: \zrender\lib\core
 **/
var isDomLevel2 = typeof window !== 'undefined' && !!window.addEventListener;

function addEventListener(el, name, handler) {
    if (isDomLevel2) {
        el.addEventListener(name, handler);
    } else {
        el.attachEvent('on' + name, handler);
    }
}

function removeEventListener(el, name, handler) {
    if (isDomLevel2) {
        el.removeEventListener(name, handler);
    } else {
        el.detachEvent('on' + name, handler);
    }
}

function stop (e) {
    if (isDomLevel2) {
        e.preventDefault()
        e.stopPropagation();
        e.cancelBubble = true;
    } else {
        e.returnValue = false;
        e.cancelBubble = true;
    }
};

function nopropagation(e) {
    e.stopImmediatePropagation();
}

function noevent (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
}

/**
 ********************************** 文字处理相关 *************************************************
 **/
// 获取文本 中英文/数字的占比情况
function getTextChar (txt) {
    var num = '0123456789'
    var char = 'abcdefghijklmnopqrstuvwxyz';
    var numLen = num.length;
    var charLen = char.length;
    var zhRegExp = /[\u4e00-\u9fa5]/;
    var num_dic = {};
    var char_l_dic = {};
    var char_u_dic = {};

    for (var nn = 0; nn < numLen; nn++) {
        num_dic[nn] = true
    }
    for (var cn = 0; cn < charLen; cn++) {
        char_l_dic[char[cn]] = true;
        char_u_dic[char[cn].toUpperCase()] = true;
    }

    var zh = 0,
        en_l = 0,
        en_u = 0, 
        num = 0,
        space = 0,
        cur;
    for (var i = 0; i < txt.length; i++) {
        cur = txt[i];
        if (zhRegExp.test(cur)) {
            zh++;
        } else if (num_dic[cur]) {
            num++;
        } else if (char_l_dic[cur]) {
            en_l++;
        } else if (char_u_dic[cur]) {
            en_u++;
        } else if (cur === ' ') {
            space++;
        }
        
    }
    return {
        zh: zh,
        en_l: en_l,
        en_u: en_u,
        num: num,
        space: space
    }
}

// 计算文本宽度
function calcTextWidth(text, font, canvas2dContext) {
	
	if (canvas2dContext) {
		canvas2dContext.font = font;
		return canvas2dContext.measureText(text).width
	} else {
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		context.font = font;
		var metrics = context.measureText(text);
		canvas = null;
		return metrics.width
	}
}

// 获取系统默认字体
function getSysFont(text) {
    var span = document.createElement('span');
    var fontFamily = '';
    span.innerHTML = text;
    span.style.display = 'none';
    document.body.appendChild(span);
    fontFamily = getComputedStyle(span).fontFamily;
    span.parentNode.removeChild(span);
    return fontFamily;
}

// 省略文本
function ellipsisText (text, limitWidth, font, canvas2dContext, ellipsisCharNum) {
    var textWidth = calcTextWidth(text, font, canvas2dContext),
        len = text.length,
        res = 0,
        lastCharIndex = '',
        ellipsisChar = '.',
        ellipsisCharWidth = 0,
        lastChar = '';
    ellipsisCharNum = ellipsisCharNum == undefined ? 3 : +ellipsisCharNum;
    if (textWidth <= limitWidth) {
        return text
    }
    ellipsisCharWidth = calcTextWidth(ellipsisChar, font, canvas2dContext);
    while (len--) {
        lastChar += text[len];
        if (calcTextWidth(lastChar, font, canvas2dContext) > Math.abs(limitWidth - textWidth - ellipsisCharWidth * ellipsisCharNum)) {
            lastCharIndex = len;
            break;
        }
    }

    res = text.slice(0, lastCharIndex);
    while (ellipsisCharNum--) {
        res += ellipsisChar;
    }
    return res;
}


// 文本断行
function calcBreakWord (text, limitWidth, fontSize, canvas2dContext) {
    var defaultSysFont = getSysFont(text),
        textWidth = calcTextWidth(text, fontSize + 'px ' + defaultSysFont, canvas2dContext), // 计算字符串总宽度;
        res = {length: 0},
        len = text.length,
        i = 0,
        char = '',
        lastCharUnit = '',
        lastIndex;

    if (textWidth > limitWidth) {
        while(i < len) {
            char += text[i];
            if (calcTextWidth(char, fontSize + 'px ' + defaultSysFont, canvas2dContext) > limitWidth) {
                lastIndex = i;
                lastCharUnit = text[i];

                res[res.length + 1] = char.slice(0, -1);
                res.length += 1;
                char = lastCharUnit;
            }
            i++;
        }
        // 添加末尾
        if (lastIndex < len) {
            res[res.length + 1] = text.slice(lastIndex);
            res.length += 1;
        }
    } else {
        res[1] = text;
        res.length += 1;
    }

    return res;
}


/**
 ********************************** DOM 位置相关  ************************************************
 */

// 点邻近某个 dom的上下距离;
function pointToDom(x, y, selector) {
    var dom = typeof selector === 'string' ? document.querySelector(selector) : selector instanceof Node ? selector : null;
    var bbox = dom ? dom.getBoundingClientRect() : {left: 0, top: 0};
    return { x: x - bbox.left,
             y: y - bbox.top
           };
}


// 获取 dom块与屏幕的位置信息
function getBoundingClientRect(el) {
    return el.getBoundingClientRect ? el.getBoundingClientRect() : {
        left: 0,
        top: 0
    };
}

/**
 ********************************** canvas相关 *************************************************
 * 参考: echarts
 **/

/**
 ********************************** 其他 *************************************************
 **/
// 线性函数: y = kx + b; domain:定义域, range:值域
function linear (domain, range) {
    if (domain[0] === domain[1]) {
        return {
            setX: function () {
                return range[0]
            },
            setY: function () {
                return domain[0]
            }
        }
    } else {
        var k = (range[1] - range[0]) / (domain[1] - domain[0]);
        var b = range[1] - k * domain[1];
        return {
            setX: function (x) {
                return k*x + b;
            },
            setY: function (y) {
                return (y - b)/k;
            }
        }
    }
}

// 获取数组中与某传入值 最相邻的值
function getNearestValue (v, array, getter) {
    var vIndex = -1,
        isFunction = typeof getter === 'function',
        i = 0,
        diff,
        oldDiff,
        cur,
        value;

    for (; i < array.length; i++) {
        cur = isFunction ? getter(array[i]) : array[i];

        diff = cur >= v ? cur - v : v - cur;
        vIndex = oldDiff <= diff ? vIndex : i;
        oldDiff = oldDiff <= diff ? oldDiff : diff;
    }

    value = isFunction ? getter(array[vIndex]) : array[vIndex];
    return {
        value: value,
        index: vIndex,
        diff: value - v
    };
}

// 判断点是否在矩形块中
function isPointInBlock (point, block) {
    var {x, y} = point;
    var _x1 = block.x;
    var _y1 = block.y;
    var {width, height} = block;

    return isInRange(x, [_x1, _x1 + width]) && isInRange(y, [_y1, _y1 + height]);
}

// 值是否包含于集合: [value], [value), (value], 这里取得全包含 []; 
function isInRange (value, arr) {
    var min = arr[0],
        max = arr[1],
        r = min;
    if (min > max) { min = max; max = r };
    return value >= min && value <= max;
}

// 两个集合是否有交集: [] [];
function isMixed (arr1, arr2) {
    var min1 = arr1[0],
        max1 = arr1[1],
        min2 = arr2[0],
        max2 = arr2[1],
        r1 = min1, 
        r2 = min2;
    if (min1 > max1) { min1 = max1; max1 = r1 };
    if (min2 > max2) { min2 = max2; max2 = r2 };

    return min1 > max2 || max1 < min1 ? false : true
}

// 计算向量间距离
function distance(v1, v2) {
    return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
}

// 块的宽高是否为零或是其他无效值
function isBlokHidden (object) {
    return typeof object.width != 'number' || object.width === 0 || typeof object.height != 'number' || object.height === 0;
}

// 计算差位数方法:
// This code was copied from "d3.js"
// <https://github.com/d3/d3/blob/9cc9a875e636a1dcf36cc1e07bdf77e1ad6e2c74/src/arrays/quantile.js>.
function quantile(ascArr, p) {
    var H = (ascArr.length - 1) * p + 1;
    var h = Math.floor(H);
    var v = +ascArr[h - 1];
    var e = H - h;
    return e ? v + e * (ascArr[h] - v) : v;
}

// 根据一个值范围, 统计数组中的符合条件的值个数:
function totalCountInAscArrByRange (ascArr, valueRange, startIndex) {
    var count = 0,
        i = parseInt(startIndex) || 0,
        len = ascArr.length,
        min = valueRange[0],
        max = valueRange[1],
        state = false,
        endIndex = i;

    for (; i<len; i++){
        if (min <= ascArr[i] && ascArr[i] <= max) {
            state = true;
            endIndex = i;
            count++;
        } else {
            if (state) {
                break;
            }
        }
    }
    return {
        value: count,
        index: [endIndex - count + 1, endIndex]
    };
}

// 获取数组中第一个有效值
function getFirst (arr) {
    arr = arr || [];
    var i = 0,
        len = arr.length;
    for (; i<len;i++) {
        if (arr[i]) {
            return arr[i];
        }
    }
}

// 获取数组中极值
function getExtremum (arr) {
    var i = 0,
        len = arr.length,
        min,
        max;
    
    for(; i<len; i++) {
        min = min < arr[i] ? min : arr[i];
        max = max > arr[i] ? max  : arr[i];
    }
    return {
        min: min,
        max: max
    }
}
 
// 深拷贝
function deepCopy(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepCopy(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepCopy(obj[attr]);
        }
        return copy;
    }

    if (isPrimitiveValue(obj)) {
        copy = obj;
        return copy;
    }
    throw new Error("Unable to copy obj! Its type isn't supported.");
}

// 对象是否包含; tactics, 比较函数(参数, n1, n2, 返回: true/false)
function contain (obj1, obj2, tactics) {
    var key1 = Object.keys(obj1);
    var key2 = Object.keys(obj2);
    var isFunction = typeof tactics === 'function';
  
    if (key2.length > key1.length) {
        return false
    }
  
    return key2.every(key => {
        return isFunction ? !!tactics(obj1[key], obj2[key]) : deepEqual(obj1[key], obj2[key]);
    })
}

// 下载文件到本地
function downLoadFile(data,fileName){
    if (!data) {
        return
    }
    var blob = new Blob([data]); // <!document><head><meta charset="utf-8"></head><body><h1>测试</h1></body>
    if (window.navigator && window.navigator.msSaveOrOpenBlob) { // for IE
        window.navigator.msSaveOrOpenBlob(blob,fileName);
    }else{
        let url = window.URL.createObjectURL(blob);
        let link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', fileName);

        document.body.appendChild(link);
        link.click();
    }
}

// 复制内容到剪贴板
function copyToClip(text, callback) {
    if(document.execCommand('Copy')){
        //创建input
        var inputZ = document.createElement('input');
        //添加Id,用于后续操作
        inputZ.setAttribute('id','inputCopy');
        //获取当前链接
        inputZ.value = text;
        //创建的input添加到body
        document.body.appendChild(inputZ);
        //选中input中的值
        document.getElementById('inputCopy').select();
        //把值复制下来
        document.execCommand('Copy')
        //删除添加的input
        document.body.removeChild(inputZ);
        // 成功回調1
        typeof callback === 'function' && callback(1);
    }else{
        // 失敗回調2
        typeof callback === 'function' && callback(2);
    }
}

// 多个数组求交集
function arrayMix () {
    var args = arguments,
        list = [].slice.call(args),
        key = typeof list[list.length - 1],
        _key = null, last = false;
  
    if (key === 'undefied') {
        return
    } else if (key === 'boolean') {
        key = 'string'
        last = list[list.length - 1]
        _key = list[list.length - 2]
        list = list.slice(0, list.length - 2);
    } else if (key === 'string') {
        _key = list[list.length - 1]
        list = list.slice(0, list.length - 1);
    }
    // console.log('参数', args)
  
    var re = list.reduce(function(pre, cur, index, array) {
        var res = [];
        var cache = {};
      
        for(var i=0;i<pre.length;i++) {
            if (key === 'string') {
                cache[pre[i][_key]] = i
            } else {
                cache[pre[i]] = true
            }
        }
  
        for(var i=0;i<cur.length;i++){
            if (key === 'string') {
                if (cache[cur[i][_key]] !== undefined) {
                    if (last) {
                        res.push(cur[i])
                    } else {
                        res.push(pre[cache[cur[i][_key]]])
                    }
                }
            } else {
                if (cache[cur[i]]) {
                    res.push(cur[i])
                }
            }
        }
  
        return res;
    });

    return re
}

// 原始值一维数组去重
function unique (arr, mode) {
    var obj = {}, res = [];
    var core_toStrintg = Object.prototype.toString;
    if (core_toStrintg.call(arr) !== '[object Array]') {
        return res
    } else {
        if (!mode || mode == 'object') {
            arr.map(item=>{
                if(!obj[item]){
                    obj[item] = true;
                    res.push(item);
                }
            })
        } else if (mode === 'array') {
            arr.map(item=>{
                if(res.indexOf(item) === -1){
                    res.push(item);
                }
            })
        }
        return res;
    }
}

// array-list 的数组分组;
function groupArrayByKey (arr, key) {
    var core_toStrintg = Object.prototype.toString,
        isArray = core_toStrintg.call(arr) === '[object Array]';
  
    var res = [],
        cache = {keys: []},
        vk;
    if (isArray) {
        for(var i = 0; i < arr.length; i++) {
            vk = arr[i][key];
            if (cache[vk]) {
                cache[vk].push(arr[i]);
            } else {
                cache[vk] = [arr[i]];
                cache.keys.push(vk);
            }
        }
    }
  
    for(var k = 0; k < cache.keys.length; k++) {
        res.push(cache[cache.keys[k]]);
    }
  
    return res;
}

// 数组中是否包含
function arrayHas (arr, obj) {
    var i = 0,
        l = arr.length;
    for (; i < l; i++) {
        if (deepEqual(arr[i], obj)) {
            return true
        }
    }
    return false
}

// 输出一个标准化的日期格式
function formatDate(time, tpl) {
    if (!time){
        return '--'
    }
    var date = new Date(time);
    if (date === 'Invalid Date' || !date) {
        return date;
    }
    var M = date.getMonth() + 1,
        d = date.getDate(),
        h = date.getHours(),
        m = date.getMinutes(),
        s = date.getSeconds();
    var obj = {
        yyyy: date.getFullYear(),
        MM: M < 10 ? '0' + M : M,
        dd: d < 10 ? '0' + d : d,
        hh: h < 10 ? '0' + h : h,
        mm: m < 10 ? '0' + m : m,
        ss: s < 10 ? '0' + s : s,
    };
    tpl = tpl || 'yyyy-MM-dd';
    return tpl.replace(/(yyyy|MM|dd|hh|mm|ss)/g, function (math) {
        return obj[math]
    });
}

// 追加查询参
function addParameter (url, name, value) {
    var newUrl = url;
    var paremeter = name + "=" + value;
    if (url.match("[\?]")) {
        //存在其他参数，用&连接
        newUrl = url + "&" + paremeter;
    } else {
        //没有参数，用?连接
        newUrl = url + "?" + paremeter;
    }
    return newUrl;
}

// 替换查询参
function replaceParameter (url, name, value) {
    var newUrl = url;
    if (querySearch(url, name)) {
        //有该参数，修改
        var replacedPar = eval('/(' + name + '=)([^&]*)/gi');
        newUrl = url.replace(replacedPar, name + '=' + value);
    } else {
        //没有该参数，增加
        newUrl = addParameter(url, name, value);
    }
    return newUrl;
}

// 对象是否相同
// 参考: https://www.cnblogs.com/mengff/p/9664287.html
function deepEqual(x, y) {
    var core_toString = Object.prototype.toString;
    var ta = core_toString.call(x);
    var tb = core_toString.call(y);
  
    if (x === y) {
        return true;
    }
    if (ta !== tb) {
        return false
    }
    if (!(typeof x == "object" && x != null) || !(typeof y == "object" && y != null)){
        return false;
    }
  
    if (Object.keys(x).length != Object.keys(y).length){
        return false;
    }
    for (var prop in x) {
        if (y.hasOwnProperty(prop)) {  
            if (!deepEqual(x[prop], y[prop])){
                return false;
            }
        } else{
            return false;
        }
    }
    
    return ta === '[object Date]' ? x.valueOf() == y.valueOf() : true;
}

function type (val) {
    var obj = {};
    var core_toString = Object.prototype.toString;
    "Boolean Number String Function Array Date RegExp Object Error Symbol".split(" ").map(name => {
        obj[ "[object " + name + "]" ] = name.toLowerCase();
    });
    return obj[core_toString.call(val)];
}

function isPrimitiveValue (val) {
    return typeof val === 'symbol' ||
           typeof val === 'string' ||
           typeof val === 'undefined' ||
           typeof val === 'number' ||
           typeof val === 'boolean' ||
           val === null
}

function isEmptyObject (obj) {
    var type = Object.prototype.toString.call(obj);
    if (type === '[object Array]') {
        return obj.length === 0
    } else if (type === '[object Object]') {
        return Object.keys(obj).length === 0
    }
}

function isUnVal (val) {
    var vals = [undefined, 'undefined', null, 'null', NaN, 'NaN', Infinity, 'Infinity', 'Invalid Date'];
    for(var i = 0; i < vals.length; i++) {
        if (val === vals[i] || Number.isNaN(val)) {
            return true
        }
    }
    return false
}

// 获取周: 一个月最多可以跨 6周, 31天, 首尾恰好位于起始时间
// from: https://stackoverflow.com/questions/9045868/javascript-date-getweek
function getWeek(timeStr) {
    var _this = new Date(timeStr);
    // We have to compare against the first monday of the year not the 01/01
    // 60*60*24*1000 = 86400000
    // 'onejan_next_monday_time' reffers to the miliseconds of the next monday after 01/01
  
    var day_miliseconds = 86400000,
        onejan = new Date(_this.getFullYear(), 0, 1, 0, 0, 0),
        onejan_day = (onejan.getDay() == 0) ? 7 : onejan.getDay(),
        days_for_next_monday = (8 - onejan_day),
        onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
        // If one jan is not a monday, get the first monday of the year
        first_monday_year_time = (onejan_day > 1) ? onejan_next_monday_time : onejan.getTime(),
        this_date = new Date(_this.getFullYear(), _this.getMonth(), _this.getDate(), 0, 0, 0), // This at 00:00:00
        this_time = this_date.getTime(),
        days_from_first_monday = Math.round(((this_time - first_monday_year_time) / day_miliseconds));
  
    var first_monday_year = new Date(first_monday_year_time);
  
    // We add 1 to "days_from_first_monday" because if "days_from_first_monday" is *7,
    // then 7/7 = 1, and as we are 7 days from first monday,
    // we should be in week number 2 instead of week number 1 (7/7=1)
    // We consider week number as 52 when "days_from_first_monday" is lower than 0,
    // that means the actual week started before the first monday so that means we are on the firsts
    // days of the year (ex: we are on Friday 01/01, then "days_from_first_monday"=-3,
    // so friday 01/01 is part of week number 52 from past year)
    // "days_from_first_monday<=364" because (364+1)/7 == 52, if we are on day 365, then (365+1)/7 >= 52 (Math.ceil(366/7)=53) and thats wrong
  
    return (days_from_first_monday >= 0 && days_from_first_monday < 364) ? Math.ceil((days_from_first_monday + 1) / 7) : 52;
}

// 对 week 的一步反运算, 计算情况: 2019,3: 2019年第3周, 对应是哪天到哪天;
function getWeekRange(year, week, tpl) {
    var day_miliseconds = 86400000,
        onejan = new Date(year, 0, 1, 0, 0, 0),
        onejan_day = (onejan.getDay() == 0) ? 7 : onejan.getDay(),
        days_for_next_monday = (8 - onejan_day),
        onejan_next_monday_time = onejan.getTime() + (days_for_next_monday * day_miliseconds),
        first_monday_year_time = (onejan_day > 1) ? onejan_next_monday_time : onejan.getTime(),
        target_week_monday_time = first_monday_year_time + day_miliseconds * 7 * (week - 1),
        target_week_sunday_time = target_week_monday_time + day_miliseconds * 6 - 1000;
  
    return [formatDate(target_week_monday_time, tpl || 'yyyy-MM-dd'), formatDate(target_week_sunday_time, tpl || 'yyyy-MM-dd')]
}

function getDate(timeStr) {
    var date = new Date(timeStr);
    var fillStr = null;

    if (date == 'Invalid Date' || isNaN(date)) {
        if (/-/.test(timeStr)) {
            fillStr = timeStr.replace(/([^-\s])+/g, function (m, i) { return m.length > 2 ? m : (+m) <= 9 ? '0' + (+m) : m });
            date = new Date(fillStr);
            if (date == 'Invalid Date' || isNaN(date)) {
                date = new Date(fillStr.replace(/-/g, '/'))
            }
        } else if (/\//.test(timeStr)) {
            fillStr = timeStr.replace(/([^/\s])+/g, function (m, i) { return m.length > 2 ? m : (+m) <= 9 ? '0' + (+m) : m });
            date = new Date(fillStr);
            if (date == 'Invalid Date' || isNaN(date)) {
                date = new Date(fillStr.replace(/\//g, '-'))
            }
        }
        if (date == 'Invalid Date' || isNaN(date)) {
            return null
        }
    }
 
    return date
}

function getTime (str) {
    var date = getDate(str);
    return date ? {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        week: getWeek(date),
        // 几号
        date: date.getDate(),
        // 周几
        day: date.getDay(),
        time: date.getTime()
    } : {}
}


function formatNumber(data) {
  let arr = []
  let keys = Object.keys(data)
  keys.forEach((v, k) => {
    arr[k] = {
      value: v,
      label: v,
      children: []
    }
    data[v].forEach(e => {
      if (e) {
        arr[k].children.push({
          value: e,
          label: e,
        })
      }
    })
  })
  return arr
}
function copy(obj, unExcept) {
    var o = {};
    for (var key in obj) {
      if (unExcept.indexOf(key) === -1) {
        o[key] = obj[key];
      }
    }
    return o;
}
function formatString (str, arg) {
    var s = [].slice.call(arguments, 1);
    return str.replace(/{([^{}]+)}/g, function (m, $1) {
        if (Number.isNaN(+$1)) {
            return arg[$1] == undefined ? '' : arg[$1]
        } else {
            return s[+$1] == undefined ? '' : s[+$1]
        }
    })
}

function min (values, valueof) {
    var n = values.length,
        i = -1,
        value,
        min;

    if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
            if ((value = values[i]) != null && value >= value) {
                min = value;
                while (++i < n) { // Compare the remaining values.
                    if ((value = values[i]) != null && min > value) {
                        min = value;
                    }
                }
            }
        }
    }
    else {
        while (++i < n) { // Find the first comparable value.
            if ((value = valueof(values[i], i, values)) != null && value >= value) {
                min = value;
                while (++i < n) { // Compare the remaining values.
                    if ((value = valueof(values[i], i, values)) != null && min > value) {
                        min = value;
                    }
                }
            }
        }
    }

    return min;
}

function max (values, valueof) {
    var n = values.length,
        i = -1,
        value,
        max;

    if (valueof == null) {
        while (++i < n) { // Find the first comparable value.
            if ((value = values[i]) != null && value >= value) {
                max = value;
                while (++i < n) { // Compare the remaining values.
                    if ((value = values[i]) != null && value > max) {
                        max = value;
                    }
                }
            }
        }
    } else {
            while (++i < n) { // Find the first comparable value.
            if ((value = valueof(values[i], i, values)) != null && value >= value) {
                max = value;
                while (++i < n) { // Compare the remaining values.
                    if ((value = valueof(values[i], i, values)) != null && value > max) {
                        max = value;
                    }
                }
            }
        }
    }

    return max;
}

// 获取平台信息
// from: vue.js
function getPlatForm () {
    var inBrowser = typeof window !== 'undefined';
    var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
    var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
    var UA = inBrowser && window.navigator.userAgent.toLowerCase();
    var isIE = UA && /msie|trident/.test(UA);
    var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
    var isEdge = UA && UA.indexOf('edge/') > 0;
    var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
    var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
    var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
    var isPhantomJS = UA && /phantomjs/.test(UA);
    var isFF = UA && UA.match(/firefox\/(\d+)/);
    return {
        inBrowser, inWeex, weexPlatform, UA, isIE, isIE9, isEdge, isAndroid, isIOS, isChrome, isPhantomJS, isFF
    }
}

// -12313.12567 => -12,313.12567: sn 分割数, mt 插入符合
function interNumber (num, sn, mt) {
    if (Number.isNaN(num)) {
        return sn;
    };
    var str = num + ''
    var bn = sn || 3;
    var sp = mt || ',';

    var sr = str.split('.');
    var left = sr[0];
    var sym = left[0] === '+' || left[0] === '-' ? left[0] : '';
    var l = left.slice(sym ? 1 : 0, left.length), r = sr[1];
    var i = l.length, _i = i;
    

    var b = '';
    for(; i >= 0; i-=bn) {
        b = l.slice(i-bn <= 0 ? 0 : i-bn, i <= 0 ? 0 : i) + (i===_i || i <= 0 ? '' : sp) + b;
    }
    
    return (sym||'') + b  + (r ? '.' + r : '');
}

// exam: abbrNumber(100000123331, { cell: [Math.pow(10,6), Math.pow(10,4), Math.pow(10,12), Math.pow(10,8)], autoFix: true})
//        => "1,000.00123331亿"
function normalizeNumber (num, option) {
    var core_toString = Object.prototype.toString,
        avaiType = ['[object Number]', '[object String]', '[object Null]'],
        opt = {
            cell: option && option.cell || Math.pow(10, 3),
            split: option && option.split || ',',
            autoFix: option ? !!option.autoFix : true,
            fixed: option ? option.fixed === undefined ? null : option.fixed : null
        },
        cellStr = {
            [Math.pow(10, 2)]: '百',
            [Math.pow(10, 3)]: '千',
            [Math.pow(10, 4)]: '万',
            [Math.pow(10, 5)]: '十万',
            [Math.pow(10, 6)]: '百万',
            [Math.pow(10, 7)]: '千万',
            [Math.pow(10, 8)]: '亿',
            [Math.pow(10, 9)]: '十亿',
            [Math.pow(10, 10)]: '百亿',
            [Math.pow(10, 11)]: '千亿',
            [Math.pow(10, 12)]: '万亿'
        },
        lb, n, ln, rn;

    if (avaiType[core_toString.call(num)] === -1) {
        return null
    }

    n = +num;
    ln = Math.log10(Math.abs(n));
    lb = Math.log10(opt.cell);

    // 如果有设置固定的基数
    if (option && option.cell) {
      // 如果是单个的一个数字, 比如: 要求是以万/亿为固定单位
      if (typeof option.cell === 'number') {
        rn = Math.pow(lb)
      }
      // 如果是一串数组, 比如: [万, 千万, 亿, 百亿, 万亿], 则根据传入值, 应用最合适的一个单位(最小/区间值/最大值); 
      else if (Array.isArray(opt.cell)) {
        // rn的初始化
        rn = Math.log10(Math.min.apply(null, option.cell));
        // 取相邻的值区间中的小值
        option.cell.map(n => {
          var cn = Math.log10(n);
          ln >= cn && (rn = rn >= cn ? rn : cn);
        })
        rn = Math.pow(10, Math.floor(rn));
      }
    }
    // 否则根据传入值, 自动匹配最接近的单位 
    else {
      // rn = opt.cell ** Math.floor(ln / lb) 自动求幂版, 10000(万) => 100000000(亿) => 万亿...; 千 => 百万 => 十亿 => 
      rn = ln >= 12 ? Math.pow(10, 12) : Math.pow(10, Math.floor(ln));  // 一级一级往上匹配版, 匹配终点: 10的 12次幂 -万亿
    }

    return opt.autoFix 
              ? interNumber(opt.fixed != undefined ? +(n / rn).toFixed(opt.fixed) : n / rn, null, opt.split) + cellStr[rn] 
              : (opt.fixed != undefined ? +(n / rn).toFixed(opt.fixed) : n / rn) + cellStr[rn];
}

// 转换时区: 18:20:20 => 10:20:20
function parseHourToUTC (timeStr, split, timeZoneOffset) {
    var hour,
        minute,
        second;
    var timeZoneOffset = timeZoneOffset || new Date().getTimezoneOffset();
    var t = timeStr.split(split);
    var t_hour = +t[0],
        t_minute = +t[1],
        t_second = +t[2],
        t_target = t_hour * 60 + t_minute + timeZoneOffset;
    hour = Math.floor(t_target / 60);
    if (hour < 0) {
        hour = 24 + hour
    }
    minute = Math.floor(t_target % 60);
    second = t_second;
    return (hour<10?'0'+hour:hour) + split + (minute<10?'0'+minute:minute) + split + (second<10?'0'+second:second);
}

function scaleTime () {
	var startTime,
		endTime,
		scaleK,
		isUnAvai;
	
	return {
		domain: function (timerange) {
			if (Array.isArray(timerange)) {
				startTime = getDate(timerange[0]);
				endTime = getDate(timerange[1]);
				isUnAvai = !startTime || !endTime;
				return this; 
			}
		},
		ticks: function (interval) {
			var res = [],
				onequant;
			interval = interval || 5;
			onequant = 1 / interval;
			scaleK = linear([0, interval-1], [startTime.getTime(), endTime.getTime()]);

			if (!isUnAvai) {
				for(var i = 0; i < interval; i++) {
					res.push(new Date( parseInt(scaleK.setX(i)) ))
				}
			}

			return res;
		}
	}
}

export {
    fullscreen,
    exitFullscreen,
    getUUid,
    getNearestValue,
    linear,
    pointToDom,
    getTextChar,
    getSysFont,
    calcTextWidth,
    ellipsisText,
    calcBreakWord,
    returnFalse,
    returnTrue,
    nopropagation,
    noevent,
    getDevicePixelRatio,
    addEventListener,
    removeEventListener,
    isPointInBlock,
    distance,
    merge,
    merge_recursive,
    typeOf,
    deepClone,
    getBoundingClientRect,
    stop,
    isInRange,
    isMixed,
    isBlokHidden,
    quantile,
    totalCountInAscArrByRange,
    getFirst,
    getExtremum,
	deepCopy,
    copy,
    contain,
    downLoadFile,
    copyToClip,
    arrayMix,
    arrayHas,
    unique,
    groupArrayByKey,
    formatDate,
    addParameter,
    replaceParameter,
    deepEqual,
    isPrimitiveValue,
    isEmptyObject,
    isUnVal,
    getDate,
    getTime,
    getWeek,
    formatNumber,
    type,
    formatString,
    min,
    max,
    getPlatForm,
    getWeekRange,
    interNumber,
    normalizeNumber,
    parseHourToUTC,
    scaleTime
}