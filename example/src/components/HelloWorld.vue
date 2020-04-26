<template>
  <div class="hello">
    <h1>测试时间轴</h1>
    <div id="timeAxis"></div>
  </div>
</template>

<script>
import * as TimeAxis from 'TimeAxis';

export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  },
  mounted () {
    console.log('方法详情', TimeAxis, TimeAxis.default);
    var timeAxisInstance = new TimeAxis('#timeAxis', {
      series: [
        {
          nodes: [
            {nodeId: 111, name: '一号'},
            {nodeId: 222, name: '二号'},
            {nodeId: 333, name: '三号'}
          ],
          links: [
            {nodeId: 111, to: 333, timestamp: '2019-01-02'},
            {nodeId: 111, to: 222, timestamp: '2019-01-04'},
            {nodeId: 222, to: 333, timestamp: '2019-01-05'}
          ]
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
