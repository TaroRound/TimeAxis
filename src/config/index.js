const SYS_DB_TIMEDATE_READER = function (v) {
    if (v == undefined || v === '') { // || v == 0
        return undefined
    } else {

        var pa = /^-?[\d.]+$/,
            sv, vc;
        // 10位时间戳, 13位时间戳, 甚至是带小数的时间戳
        if (pa.test(v)) {
            sv = v + '';
            vc = sv.match(/^-?(\d+)/)[1];
            return new Date(vc.length <= 11 ? parseInt(sv * 1000) : v);
        } 
        // '2017-01-01 00:00:00'
        else {
            return new Date(new Date(v).getTime());
        }
    }
}

export {
    SYS_DB_TIMEDATE_READER
}