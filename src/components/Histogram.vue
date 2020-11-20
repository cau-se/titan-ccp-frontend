<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Histogram</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="histogram"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
declare var require: any
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import LoadingSpinner from './LoadingSpinner.vue'
import { HTTP } from '../http-common'
import { Sensor, AggregatedSensor } from '../SensorRegistry'
import * as d3 from 'd3'
import * as _ from 'lodash' 
import 'britecharts/dist/css/charts/bar.min.css'
import TimeMode from '../model/time-mode'
const britecharts = require('britecharts')

@Component({
  components: {
    LoadingSpinner
  }
})
export default class Histogram extends Vue {

  @Prop({ required: true }) sensor!: Sensor
  @Prop({required: true }) timeMode!: TimeMode
  @Prop({ default: 8}) buckets!: number

  private isLoading = true
  private isError = false
  private barChart!: any
  private tooltip!: any
  private container!: d3.Selection<HTMLElement, any, HTMLElement, any>
  private containerWidth!: number
  private containerHeight!: number
  private barData!: Array<{name:string, value:number}>

  mounted () {
    this.barChart = new britecharts.bar()
    this.container = d3.select('.histogram')
    this.containerWidth = this.container.node()!.getBoundingClientRect().width
    this.containerHeight = this.container.node()!.getBoundingClientRect().height
    this.barData = []
    this.tooltip = new britecharts.miniTooltip()
    
    this.barChart
      .height(this.containerHeight)
      .width(this.containerWidth)
      .isAnimated(true)
      .isHorizontal(true)
      .yAxisPaddingBetweenChart(10)
      .on('customMouseOver', this.tooltip.show)
      .on('customMouseMove', this.tooltip.update)
      .on('customMouseOut', this.tooltip.hide)
      .margin({left: 93, bottom: 14}) 

    this.updateHistogram()

    //make the chart responsive
    const redrawChart = () => {
      const newContainerWidth = this.container.node() ? this.container.node()!.getBoundingClientRect().width : false
      this.barChart.width(newContainerWidth)
      this.container.call(this.barChart)
    } 
    const throttledRedraw = _.throttle(redrawChart, 200)
    window.addEventListener('resize', throttledRedraw)
  }

  @Watch('sensor')
  onSensorChanged (sensor: Sensor) {
    this.updateHistogram()
  }

  private updateHistogram () {
    // let resource = this.sensor instanceof AggregatedSensor ? 'aggregated-power-consumption' : 'power-consumption',
    //     after = new Date().getTime() - (1 * 3600 * 1000)
    // HTTP.get(resource + '/' + this.sensor.identifier + '/distribution?after=' + after+ '&buckets=' + this.buckets)
    let resource = this.sensor instanceof AggregatedSensor
      ? 'active-power/aggregated'
      : 'active-power/raw'
    // Distribution of last hour
    let after = this.timeMode.getTime().minus({ hours: 1 })
    let to = this.timeMode.getTime()
    HTTP.get(
      resource +
        '/' +
        this.sensor.identifier +
        '/distribution?after=' +
        after.toMillis() +
        '&to=' +
        to.toMillis() +
        '&buckets=' +
        this.buckets
      )
      .then(response => {
        // JSON responses are automatically parsed.
        let name: string = ''
        let value: number = 0
        for (let bucket of response.data) {
            name = '' + bucket.lower.toFixed(1) + ' - ' + bucket.upper.toFixed(1)
            if(!isNaN(bucket.elements))
                this.barData.push({ name:name, value: bucket.elements })
        }
        return this.barData
      })
      .catch(e => {
        console.error(e)
        this.isError = true
        return [{name: this.sensor.identifier, value: 0}]
      })
      .then(data => {
        this.container.datum(data).call(this.barChart)
        let tooltipContainer = d3.select('.histogram .bar-chart .metadata-group')
        tooltipContainer.datum([]).call(this.tooltip)
        this.isLoading = false
      })
  }
}
</script>

<style scoped>
  .histogram {
    height: 300px
  }
</style>