import {linear, pointToDom, typeOf, merge_recursive, isInRange, calcBreakWord, getUUid, totalCountInAscArrByRange, getFirst, getExtremum, formatDate} from '../../lib/util/index';

class dataZoom {
    constructor (canvasDOM, {
        x,
        y,
        width,
        height
    }, eventHandler) {
        this.markFullWrapper = document.createElement('div');
        this.eventManager = eventHandler || {};
    }


    init () {
    }

    update (setting) {
        merge_recursive(this, setting);
    }


    // canvas原生 API, 坐标点是否在路径内
    isPointInPath (context, x, y) {
        return context.isPointInPath(x, y);
    }

    initEventHandler () {
        if (this.eventManager) {
        }
    }


    emit (eventType) {

    }

    on (eventTye, cb) {
        this.eventManager.addEvent('datazoom-' + eventTye + this.uid, cb);
    }


    destroy () {
    }
}

export default dataZoom;

export {
    dataZoom
}