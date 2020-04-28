<template>
  <div class="hello">
    <h1>测试时间轴</h1>
    <div id="timeAxis" style="width: 1200px; height: 600px;"></div>
  </div>
</template>

<script>
import TimeAxis from '../../../dist/index.js';

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  mounted () {
    var timeAxisInstance = new TimeAxis('#timeAxis', {
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
      ]
    });

    timeAxisInstance.on('legendChange', function (eventInfo, data, event) {
      console.log('监听事件', eventInfo, data, event);
    })
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
