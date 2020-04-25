
import './style.less';

function getValueByKey (arr, label, labelVal, anotherLabel) {
    var val;
    arr.map(item=>{
        if (item[label] === labelVal) {
            val = item[anotherLabel]
        }
    });
    return val
}

// htmlCss => html-css 
function normalizeCamel (str) {
    return str.replace(/[A-Z]/g, function ($1) { return '-' + $1.toLowerCase() })
}

// 不考虑是否符合 html嵌套规范, 不考虑往 html中插入脚本的情况;
function createElement (tagName, isClose, attrs, html) {
    var attrstr = '';
    
    for (var key in attrs) {
        if (typeof attrs[key] === 'object' && attrs[key]) {
            var subAttr = '';
            for (var k in attrs[key]) {
                subAttr += normalizeCamel(k) + ':' + (attrs[key][k] || '') + ';'
            }
            subAttr = subAttr.replace(/;$/, '');
            attrstr += normalizeCamel(key) + '="' + subAttr + '" ';
        } else {
            attrstr += normalizeCamel(key) + '="' + (attrs[key] || '') + '" ';
        }
    }

    return isClose ? `<${tagName} ${attrstr.trim()}>${html}</${tagName}>` : `<${tagName} ${attrstr.trim()} />`
}

var eventMg = {
    getEvent: function(event){
        return event ? event : window.event;
    },
    stopPropagation: function (event) {
        event = this.getEvent();
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    },
    getTarget: function (event) {
        event = this.getEvent();
        return event.target || event.srcElement;
    },
    removeEvent: function(elem, type, fn){
        if(elem.removeEventListener){
            elem.removeEventListener(type,fn);
        }else if(elem.detachEvent){
            elem.detachEvent("on"+type,fn);
        }else{
            elem['on' + type] = null
            return false;
        }
    },
    addEvent: function(elem,type,fn,boolean){
        if(elem.addEventListener){
            elem.addEventListener(type, fn, boolean);
        }else if(elem.attachEvent){
            elem.attachEvent("on"+type,fn);
        }else{
            elem['on' + type] = fn
            return false;
        }
    }
}



// 可分组的多选框;
class SearchSelect {
    constructor (option) {
        var overLay = option.elem ? document.querySelector(option.elem) : document.body,
            outerBoundingClientRect, outerWidth, outerHeight;
        if (!overLay) {
            return
        }

        outerBoundingClientRect = overLay.getBoundingClientRect();
        outerWidth = outerBoundingClientRect.width;
        outerHeight = outerBoundingClientRect.height;

        this.option = {
            uuid: (Math.random() * 100000 + '_' + Math.random() * 1500).replace(/\./g, ''),
            selector: option.elem,
            event: {},
            setting: {
                multiple: option.multiple || true,
                displayField: option.displayField || null,
                valueField: option.valueField || null,
                data: option.data || null,
                disable: option.disable || false,
                disableField: option.disableField || null,
                placeholder: option.placeholder || null
            }
        }

        var fullWrap = document.createElement('div');
        fullWrap.className = 'multeSelect_container';

        this.wrapDom = fullWrap;
        this.select = document.createElement('div');
        this.select.className = 'select-container';
        fullWrap.appendChild(this.select);
        overLay.appendChild(fullWrap);
        
        this.renderValue();
        this.renderDrop();
        this.initEvent();
    }

    show () {
        this.wrapDom.classList.add('active');
    }

    hide () {
        this.wrapDom.classList.remove('active');
    }

    clear () {

    }

    renderValue () {
        var selectContainer = this.select;
        var ipt = document.createElement('div');
        ipt.className = 'select-value-input';
        ipt.dataset.value = '';
        ipt.innerHTML = this.option.setting.placeholder || '';
        selectContainer.appendChild(ipt);
    }

    renderDrop () {
        var selectContainer = this.select;
        var setting = this.option.setting;
        var dropContainer = document.createElement('div');
        dropContainer.className = 'select-drop-container';

        var searchIpt = document.createElement('div');
        searchIpt.className = 'select-drop-search';
        var ipt = document.createElement('input');
        ipt.className = 'select-drop-search-input';

        searchIpt.appendChild(ipt);
        dropContainer.appendChild(searchIpt);

        var list = document.createElement('div');
        list.className = 'select-drop-result';

        var innerHtml = `<ul>
            ${
                setting.data.length ? '<li data-value="all">全选</li>' : '<li data-value="empty">无数据</li>'
            }
            ${
                setting.data.map(item => {
                    return ('<li data-value="' + item[setting.valueField] + '" class="select-drop-item ' + (item[setting.disableField] ? 'disabeld':'') + '" title="' + item[setting.valueField] + '">' + item[setting.displayField] + '</li>')
                }).join('')
            }
        </ul>`;
        list.innerHTML = innerHtml;
        dropContainer.appendChild(list);

        selectContainer.appendChild(dropContainer);

        selectContainer = setting = dropContainer = searchIpt = ipt = list = innerHtml = null;
    }

    initEvent () {
        var ipt = document.querySelector('.select-drop-search-input');
        var result = document.querySelector('.select-drop-result');
        var valueDis = document.querySelector('.select-value-input');

        eventMg.addEvent(result, 'click', this.clickHandler.bind(this));
        eventMg.addEvent(ipt, 'keyup', this.keyUpHandler.bind(this));
        eventMg.addEvent(ipt, 'click', this.searchIptClick.bind(this));
        eventMg.addEvent(valueDis, 'click', this.tollge.bind(this));
        

        // result.addEventListener('click', this.clickHandler.bind(this));
        // ipt.addEventListener('keyup', this.keyUpHandler.bind(this));
        // valueDis.addEventListener('click', this.tollge.bind(this));
        // ipt.addEventListener('click', this.searchIptClick)
        ipt = result = valueDis = null;
    }

    searchIptClick (e) {
        eventMg.stopPropagation();
    }

    keyUpHandler (e) {
        var target = e.srcElement || e.target;
        var val = target.value;
        var setting = this.option.setting;
        var valueDis = document.querySelector('.select-value-input');
        var valueDisValue = (valueDis.dataset.value || '').split(',');
        var list = document.querySelector('.select-drop-result');

        var newData = setting.data.filter(item => {
            return ~item[setting.displayField].indexOf(val)
        });
        // console.log('排一下序...', newData);
        var innerHtml = `<ul>
            ${
                newData.length ? '<li data-value="all">全选</li>' : '<li data-value="empty">无匹配项</li>' // 
            }
            ${
                newData.map(item => {
                    return ('<li data-value="' + item[setting.valueField] + '" class="select-drop-item ' + (item[setting.disableField] ? 'disabeld':'') + (~valueDisValue.indexOf(item[setting.valueField])?'active':'') + '" title="' + item[setting.valueField] + '">' + item[setting.displayField] + '</li>')
                }).join('')
            }
        </ul>`;
        list.innerHTML = innerHtml;

        target = val = setting = valueDis = valueDisValue = list = newData = innerHtml = null;
    }

    tollge (e) {
        var _this = this;
        var result = document.querySelector('.select-drop-container');
        var valueDis = document.querySelector('.select-value-input');
        var className = ' ' + result.className + ' ';
        var latestValue = valueDis.dataset.value;
        var eventTarget = eventMg.getTarget();

        var SPAN = null;
        var TXT = null;

        var cb = function () {
            result.className = result.className.replace(/active/g, '').trim();
            if (latestValue !== valueDis.dataset.value) {
                typeof _this.option.event['change'] === 'function' && _this.option.event['change'](valueDis.dataset.value);
            }
            eventMg.removeEvent(document, 'click', cb);
            _this = result = valueDis = className = latestValue = eventTarget = SPAN = TXT = cb = null;
        };

        if (eventTarget.nodeType === 1) {
            switch (eventTarget.tagName) {
                case 'DIV':

                    if (className.indexOf(' active ') === -1) {
                        result.classList.add('active');
                        eventMg.addEvent(document, 'click', cb);
                    } else {
                        result.classList.remove('active')
                        eventMg.removeEvent(document, 'click', cb);
                    }
                    break;
                case 'EM':

                    SPAN = eventTarget.parentNode;
                    TXT = getValueByKey(_this.option.setting.data, _this.option.setting.displayField, SPAN.innerText.replace(/x$/,''), _this.option.setting.valueField);
                    SPAN.parentNode.removeChild(SPAN);
                    valueDis.dataset.value = valueDis.dataset.value.replace(new RegExp(',?' + TXT, 'g'), '').replace(/(^,|,$)/, '');
                    document.querySelector('.select-drop-item[data-value="'+TXT+'"]').classList.remove('active');
                    eventMg.addEvent(document, 'click', cb);
                    if (valueDis.dataset.value === '') {
                        valueDis.innerHTML = _this.option.setting.placeholder;
                    }
                    break;
                default:
                    break;
            }
            eventMg.stopPropagation();
        }
    }

    clickHandler (e) {
        var _this = this;
        var target = e.srcElement || e.target;
        var valueDis = document.querySelector('.select-value-input');
        var valueDisValue = valueDis.dataset.value || '';
        var valueDisHTML = (valueDis.innerHTML || '').replace(_this.option.setting.placeholder, '');

        var className, label, value, allData, allHTML = '', allValue = '', allDropItem = null, selectDropItemNumber = 0;
        // LI 标签
        if (target.nodeType === 1 && target.tagName === 'LI') {
            valueDis.innerHTML = valueDisHTML.replace(_this.option.setting.placeholder, '');
            className = ' ' + target.className + ' ';
            label = target.innerText;
            value = target.dataset.value;

            switch (value) {
                case 'all':
                    if (className.indexOf(' active ') === -1) {
                        _this.option.setting.data.map(item=>{
                            allValue += ',' + item[_this.option.setting.valueField];
                            allHTML += '<span class="select-value-item">' + item[_this.option.setting.displayField] + '<em>x</em></span>';
                        });
                        valueDis.innerHTML = allHTML;
                        valueDis.dataset.value = allValue.replace(/^,/, '');
                        document.querySelectorAll('.select-drop-item').forEach((dom) => {
                            if (!dom.classList.contains('disabeld')) {
                                dom.classList.add('active')
                            }
                        });
                    } else {
                        valueDis.innerHTML = _this.option.setting.placeholder;
                        valueDis.dataset.value = '';
                        document.querySelectorAll('.select-drop-item').forEach((dom) => {
                            dom.classList.remove('active')
                        });
                    }
                    className.indexOf(' active ') === -1 ? target.classList.add('active') : target.classList.remove('active');
                    break;
                case 'empty':
                    break;
                default:
                    if (~className.indexOf('disabeld')) {
                        
                    } else {
                        if (className.indexOf(' active ') === -1) {
                            valueDis.dataset.value += valueDisValue ? ',' + value : value;
                            valueDis.innerHTML += '<span class="select-value-item">'+label+'<em>x</em></span>';
                        } else {
                            valueDis.dataset.value = valueDisValue.replace(new RegExp(',?' + value, 'g'), '').replace(/(^,|,$)/, '');
                            if (valueDis.dataset.value === '') {
                                valueDis.innerHTML = _this.option.setting.placeholder;
                            } else {
                                valueDis.innerHTML = valueDisHTML.replace(new RegExp('<span class="select-value-item">' + label + '<em>x</em></span>', 'g'), '').replace(/(^,|,$)/, '');
                            }
                        }
                        className.indexOf(' active ') === -1 ? target.classList.add('active') : target.classList.remove('active');
                    }
                    // allDropItem = document.querySelectorAll('.select-drop-item');
                    // allDropItem.forEach((dom) => {
                    //     if (/active/.test(' ' + dom.className + ' ')) {
                    //         selectDropItemNumber++;
                    //     }
                    // });
                    // if( document.querySelector('.select-drop-container li[data-value=all]') ) {
                    //     document.querySelector('.select-drop-container li[data-value=all]').className = allDropItem.length === selectDropItemNumber ? 'active' : '';
                    // }
                    break;
            }
        }

        eventMg.stopPropagation();
        target = valueDis = className = label = value = valueDisValue = valueDisHTML = _this = allHTML = allValue = allDropItem = null;
    }

    setValue (params) {
        var _this = this;
        var type = Object.prototype.toString.call(params);
        var valueDis = document.querySelector('.select-value-input');
        var vals, html = '';

        if (type === '[object String]') {
            valueDis.dataset.value = params;

            vals = params.split(',');
            vals.map(label=>{
                
                var txt = getValueByKey(_this.option.setting.data, _this.option.setting.displayField, label, _this.option.setting.valueField);
                html += '<span class="select-value-item">'+txt+'<em>x</em></span>';
                txt = null;
            });
            valueDis.innerHTML = html;

            document.querySelectorAll('.select-drop-item').forEach((dom) => {
                if (~vals.indexOf(dom.dataset.value) && !dom.classList.contains('disabled')) {
                    dom.classList.add('active');
                }
            })
        } else if (type === '[object Array]') {
            valueDis.dataset.value = params.join(',');
            // valueDis.innerHTML = params.join(',');
            params.map(label=>{
                var txt = getValueByKey(_this.option.setting.data, _this.option.setting.displayField, label, _this.option.setting.valueField);
                html += '<span class="select-value-item">'+txt+'<em>x</em></span>';
                txt = null;
            });
            valueDis.innerHTML = html;

            document.querySelectorAll('.select-drop-item').forEach((dom) => {
                if (~params.indexOf(dom.dataset.value) && !dom.classList.contains('disabled')) {
                    dom.classList.add('active');
                }
            })
        }

        type = valueDis = vals = html = null;
    }

    getValue () {
        var valueDis = document.querySelector('.select-value-input');
        return valueDis.dataset.value || '';
    }

    on (eventType, cb) {
        this.option.event[eventType] = cb;
    }

    off (eventType) {
        delete this.option.event[eventType]
    }

    show () {
        this.wrapDom.classList.add('active');
    }

    hide () {
        this.wrapDom.classList.remove('active');
    }
}

export default SearchSelect