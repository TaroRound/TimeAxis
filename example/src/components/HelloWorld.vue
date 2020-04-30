<template>
  <div class="hello" style="padding: 100px;height: 100%;box-sizing:border-box;">
    <div id="timeAxis" style="width: 100%; height: 100%; box-shadow: 0px 0px 5px rgba(0,0,0,0.8);"></div>
  </div>
</template>

<script>
import TimeAxis from '../../../dist/index.js';
import {formatDate} from '../../../src/lib/util/index'

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
      series: [
        {
          name: '示例1',
          title: {
            show: true
          },
          data: {
            nodes: [
              {nodeId: 111, text: '一号'},
              {nodeId: 222, text: '二号'},
              {nodeId: 333, text: '三号'}
            ],
            links: [
              {from: 111, to: 333, timestamp: '2019-01-02'},
              {from: 111, to: 222, timestamp: '2019-01-04'},
              {from: 222, to: 333, timestamp: '2019-01-05'}
            ]
          }
        }, {
          name: '示例2',
          title: {
            show: true
          },
          data: {
            nodes: [
              {nodeId: 111, text: '一号'},
              {nodeId: 222, text: '二号'},
              {nodeId: 333, text: '三号'}
            ],
            links: [
              {from: 111, to: 333, timestamp: '2019-01-02'},
              {from: 111, to: 222, timestamp: '2019-01-04'},
              {from: 222, to: 333, timestamp: '2019-01-05'}
            ]
          }
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
        groupId: '组2',
        end: 40
      });

      timeAxisInstance.dispatchAction({
        type: 'legendSelect',
        data: {
          groupId: '组2',
          name: ['QZ', 'HY']
        }
      });

      timeAxisInstance.dispatchAction({
        type: 'legendUnSelect',
        data: {
          groupId: '组1',
          name: ['HD']
        }
      });
    }, 1000);
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
