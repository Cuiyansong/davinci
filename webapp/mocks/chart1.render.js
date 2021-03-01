function render(hooks, id, host) {
  const iChart = echarts.init(host ? host: document.getElementById(id))

  // feat: Support auto resize
  const resizeHandler = () => {
    iChart.resize()
  }

  const getKeys = data => {
    const keys = Object.keys(data[0]);
    const xDataKey = keys.find(k => !data[0][k] || Number.isNaN(+data[0][k]));
    const yData1Key = keys.find(k => data[0][k] && !Number.isNaN(+data[0][k]));
    const yData2Key  = keys.find(k => data[0][k] && !Number.isNaN(+data[0][k]) && k !== yData1Key);

    return {
      xDataKey, yData1Key, yData2Key
    }
  }

  const formatData = data => {
    const { xDataKey, yData1Key, yData2Key } = getKeys(data);
    console.log("keys ----> ", xDataKey, yData1Key, yData2Key)


    const xData = data.map((item) => item[xDataKey])
    const yData1 = data.map((item) => item[yData1Key])
    const yData2 = data.map((item) => item[yData2Key])
    const option = {
      xAxis: {
        type: 'category',
        data: xData
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: yData1Key,
          data: yData1,
          type: 'line'
        },
        {
          name: yData2Key,
          data: yData2,
          type: 'line'
        }
      ]
    }
    return option
  }

  hooks.on('mount', (data, style) => {
    console.log('chart1 - mount')
    const option = formatData(data)
    iChart.setOption(Object.assign({}, style, option))
    window.addEventListener('resize', resizeHandler)
  })

  hooks.on('update', (newData, style) => {
    console.log('chart1 - update')
    const option = formatData(newData)
    iChart.setOption(Object.assign({}, style, option))
  })

  hooks.on('unmount', () => {
    console.log('chart1 - unmount')
    window.removeEventListener('resize', resizeHandler)
    iChart.dispose()
  })
}
