const color = ['#00a0e9', '#eb6100', '#80c269', '#009944', '#f39800', '#009e96', '#22ac38', '#8fc31f', '#00ff00', '#fff100' ];

const getColor = (function (colors) {
    var i = 0;
    return function () {
        return colors[i > colors.length - 1 ? 0 : i++]
    }
})(color)

export {
    getColor,
    color
}