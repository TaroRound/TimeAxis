import {formatDate, getDate, getWeek} from '../../lib/util/index'

const autoFixXTicks = function (startTime, endTime, interval) {
    if (startTime && endTime) {
        var _endTime = new Date(endTime);
        if (_endTime < startTime) {
            endTime = startTime;
            startTime = _endTime;
        }
    }
    var ticks = [],
        oneDayTimes = 86400000,
        timeReader;

    var returnSecond = function (t) { return formatDate(t, 'yyyy-MM-dd hh:mm:ss') };
    var returnMinute = function (t) { return formatDate(t, 'yyyy-MM-dd hh:mm') };
    var returnHour = function (t) { return formatDate(t, 'yyyy-MM-dd hh:00') };
    var returnDay = function (t) { return formatDate(t, 'yyyy-MM-dd') };
    var returnMonth = function (t) { return formatDate(t, 'yyyy-MM') };
    var returnYear = function (t) { return formatDate(t, 'yyyy') };
    var returnWeek = function (t) { return getDate(t).getFullYear() + '第 ' + getWeek(t) + '周' }
    var timeFactory = scaleTime().domain([startTime, endTime]);

    var distance = endTime - startTime;
    // 两小时之内: 返回秒
    if (0 <= distance && distance <= oneDayTimes / 12) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnSecond;
    }
    // 超过两小时, 小于六小时, 返回分
    else if (oneDayTimes / 12 < distance && distance <= oneDayTimes / 2) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnMinute;
    }
    // 大于六小时, 小于三天, 返回小时
    else if (oneDayTimes / 2 < distance && distance <= oneDayTimes * 3) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnHour;
    }
    // 大于三天, 小于30天, 返回天
    else if (oneDayTimes * 3 < distance && distance <= oneDayTimes * 30) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnDay;
    }
    // 大30天, 小于180天, 返回周
    else if (oneDayTimes * 30 < distance && distance <= oneDayTimes * 180) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnWeek;
    }
    // 大于180天, 小于5年, 返回月
    else if (oneDayTimes * 180 < distance && distance <= oneDayTimes * 365 * 5) {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnMonth;
    }
    // 大于 5年, 返回年
    else {
        ticks = [...timeFactory.ticks(interval)];
        timeReader = returnYear;
    }

    return {ticks, timeReader}
}

exports.autoFixXTicks = autoFixXTicks;