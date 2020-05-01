<template>
  <div class="hello" style="padding: 100px;height: 100%;box-sizing:border-box;">
    <div id="timeAxis" style="width: 100%; height: 100%; box-shadow: 0px 0px 5px rgba(0,0,0,0.8);"></div>
  </div>
</template>

<script>
import TimeAxis from '../../../dist/index.js';
import {formatDate} from '../../../src/lib/util/index'


function generateData (nodeLen, linkLen) {
  var nodes = [];
  var links = [];
  var offset = 360;
  var oneday = 86400000;

  var char = 'abcdefghijklmnopqrstuvwxyz';
  var nodeId = null;
  for (var i = 0; i < nodeLen; i++) {
    nodeId = char[(Math.random() * char.length) | 0] + Math.floor(Math.random() * 7303 * 2401);
    nodes.push({
      nodeId: nodeId,
      text: char[(Math.random() * char.length) | 0] + Math.floor(Math.random() * 7303 * 2401)
    })
  }

  var time = null,
      from = null,
      to = null;
  for (var k = 0; k < linkLen; k++) {
    time = formatDate(new Date(new Date().getTime() - (offset * oneday * Math.random() ^ 0)), 'yyyy-MM-dd hh:');
    // time = Math.random() * 1000000000;
    from = nodes[(Math.random() * nodeLen ^ 0)].nodeId;
    to = nodes[(Math.random() * nodeLen ^ 0)].nodeId;
    links.push({
      from: from,
      to: to,
      timestamp: time
    })
  }

  return {
    nodes: nodes,
    links: links
  }
}

var series1 = generateData(80, 300);
var series2 = generateData(80, 200);

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
            return formatDate(new Date(vc.length <= 11 ? parseInt(sv * 1000) : v), 'yyyy-MM-dd hh:mm:ss');
        } 
        // '2017-01-01 00:00:00'
        else {
            return formatDate(new Date(new Date(v).getTime()), 'yyyy-MM-dd hh:mm:ss');
        }
    }
}
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      defaultBgColor: {
        'HD': 'to bottom: 0% #75A4FF:100% #4258E5', // 话单
        'YH': 'to bottom: 0% #FFA22F:100% #F28600', // 银行
        'HY': 'to bottom: 0% #2AAE30:100% #1ABE52', // 好友
        'QZ': 'to bottom: 0% #7648FF:100% #6748EE', // 群组
        'DX': 'to bottom: 0% #1BC9E1:100% #06A2C3', // 短信
        'CX': 'to bottom: 0% #FFA22F:100% #F28600' // 彩信
      }
    }
  },
  mounted () {
    var timeAxisInstance = new TimeAxis('#timeAxis', {
      background: '#fff',
      safePerformance: Infinity,
      axis: {
        text: {
          formatter: SYS_DB_TIMEDATE_READER
        }
      },
      dataZoom: {
        boundaryText: {
          formatter: SYS_DB_TIMEDATE_READER
        }
      },
      series: [
        {
          name: '示例1',
          groupId: '示例1',
          title: {
            show: true
          },
          data: series1
        }, {
          name: '示例2',
          groupId: '示例2',
          title: {
            show: true
          },
          data: series2
        }
      ],
      nodePadding: {right: 15},
      nodeSlider: {
        show: true
      }
    });

    timeAxisInstance.on('legendChange', function (eventInfo, data, event) {
      console.log('监听事件', eventInfo, data, event);
    });

    setTimeout(() => {
      timeAxisInstance.dispatchAction({
        type: 'dataZoom',
        start: 50,
        end: 60
      });

      timeAxisInstance.dispatchAction({
        type: 'dataZoom',
        start: 30,
        groupId: '示例1',
        end: 40
      });

      timeAxisInstance.dispatchAction({
        type: 'legendSelect',
        data: {
          groupId: '示例1',
          name: ['QZ', 'HY']
        }
      });

      timeAxisInstance.dispatchAction({
        type: 'legendUnSelect',
        data: {
          groupId: '示例2',
          name: ['HD']
        }
      });
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
