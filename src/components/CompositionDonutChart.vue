<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Composition</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="donut-container"></div>
        <div class="unvisible-legend-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator"
import { SensorRegistryRequester, AggregatedSensor, Sensor, SensorRegistry } from '../SensorRegistry'
import { HTTP } from "../http-common"
import LoadingSpinner from "./LoadingSpinner.vue"
import * as d3 from 'd3'
import * as _ from 'lodash'
import TimeMode from "../model/time-mode"
const britecharts = require('britecharts')

@Component({
  components: {
    LoadingSpinner
  }
})
export default class CompositionDonutChart extends Vue {
  @Prop({ required: true }) sensor!: AggregatedSensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false
  private donutChart!: any
  private legendChart!: any
  private container!: d3.Selection<HTMLElement, any, HTMLElement, any>
  private containerWidth!: number
  private donutData!: Array<{quantity: number, percentage: number, name: string, id: number}>

  mounted () {
    this.donutChart = new britecharts.donut()
    this.container = d3.select(".donut-container")
    this.donutData = []
    this.containerWidth = this.container.node()!.getBoundingClientRect().width
    this.legendChart = this.getLegendChart(this.donutData, britecharts.colors.colorSchemas.britecharts)

    this.donutChart
        .width(this.containerWidth)
        .externalRadius(this.containerWidth/3.3)
        .internalRadius(this.containerWidth/5.5)
        .isAnimated(true)
        .hasFixedHighlightedSlice(true)
        .highlightSliceById(1)
        .on('customMouseOver', (data: any) => {
            this.legendChart.highlight(data.data.id)
        })
        .on('customMouseOut', () => {
            this.legendChart.highlight()
        })
    this.updateChart()

    // make the chart responsive
    const redrawChart = () => {
      const newContainerWidth = this.container.node() ? this.container.node()!.getBoundingClientRect().width : false
      this.donutChart.width(newContainerWidth)
      this.container.call(this.donutChart)
    }
    const throttledRedraw = _.throttle(redrawChart, 200)
    window.addEventListener("resize", throttledRedraw)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.updateChart()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.updateChart()
  }

  private updateChart () {
    this.isLoading = true

    let to = this.timeMode.getTime()

    Promise.all(this.sensor.children.map(child => {
      let resource = child instanceof AggregatedSensor ? 'active-power/aggregated' : 'active-power/raw'
      return HTTP.get(resource + '/' + child.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          // JSON responses are automatically parsed.
          let value
          if (response.data.length <= 0) {
            value = 0
          } else if (child instanceof AggregatedSensor) {
            value = response.data[0].sumInW
          } else {
            value = response.data[0].valueInW
          }
          return [child.title, value] as [string, number]
        })
    })).catch(e => {
      console.error(e)
      this.isError = true
      return []
    }).then(columns => {
     let sum = 0
      let id = 1
      for (let i = 0; i < columns.length; i++) {
          sum += columns[i][1]
      }
      for (let i = 0; i < columns.length; i++) {
        let percentage = (columns[i][1]/sum) * 100
        percentage = parseFloat(percentage.toFixed(1))
        this.donutData.push({quantity: columns[i][1], percentage:percentage , name: columns[i][0], id: id })
        id ++
      }
      this.isLoading = false
      this.container.datum(this.donutData).call(this.donutChart)
    })
  }

  private getLegendChart(dataset:Array<{quantity: number, percentage: number, name: string, id: number}>, optionalColorSchema: any) {
    let legendChart =  new britecharts.legend()
    let legendContainer = d3.select('.unvisible-legend-container')
    let containerWidth = legendContainer.node() ? (legendContainer.node() as any).getBoundingClientRect().width : false

    if (containerWidth) {
        d3.select('.unvisible-legend-container .britechart-legend').remove()
        legendChart
          .width(containerWidth)
          .height(0)
          .numberFormat('s')
        if (optionalColorSchema)
            legendChart.colorSchema(optionalColorSchema)
    legendContainer.datum(dataset).call(legendChart)
    return legendChart
    }
  }
}
</script>

<style scoped>
  .donut-container {
    height: 300px;
  }
  .unvisible-legend-container {
    height: 0px;
  }
</style>
