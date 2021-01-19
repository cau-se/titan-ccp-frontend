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

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { select as d3select, Selection } from 'd3-selection'
import bar from 'britecharts/dist/umd/bar.min'
import miniTooltip from 'britecharts/dist/umd/miniTooltip.min'
import 'britecharts/dist/css/charts/bar.min.css'
import debounce from 'lodash.debounce'

import { HTTP } from '@/model/http-common'
import { Sensor, AggregatedSensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class Histogram extends Vue {
  @Prop({ required: true }) sensor!: Sensor
  @Prop({ required: true }) timeMode!: TimeMode
  @Prop({ default: 8 }) buckets!: number

  private isLoading = true;
  private isError = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private barChart!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tooltip!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private container!: Selection<HTMLElement, any, HTMLElement, any>;
  private containerWidth!: number;
  private containerHeight!: number;

  mounted () {
    // eslint-disable-next-line new-cap
    this.barChart = new bar()
    this.container = d3select('.histogram')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.containerWidth = this.container.node()!.getBoundingClientRect().width
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.containerHeight = this.container.node()!.getBoundingClientRect().height
    // eslint-disable-next-line new-cap
    this.tooltip = new miniTooltip()

    this.barChart
      .height(this.containerHeight)
      .width(this.containerWidth)
      .isAnimated(true)
      .yAxisPaddingBetweenChart(10)
      .on('customMouseOver', this.tooltip.show)
      .on('customMouseMove', this.tooltip.update)
      .on('customMouseOut', this.tooltip.hide)
      .margin({ left: 60, bottom: 18 })

    this.updateHistogram()

    // make the chart responsive
    const redrawChart = () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const newContainerWidth = this.container.node() ? this.container.node()!.getBoundingClientRect().width : false
      this.barChart.width(newContainerWidth)
      this.container.call(this.barChart)
    }
    const throttledRedraw = debounce(redrawChart, 200)
    window.addEventListener('resize', throttledRedraw)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.updateHistogram()
  }

  private updateHistogram () {
    const barData: Array<{name: string; tooltipLabel: string; value: number}> = []

    const resource = this.sensor instanceof AggregatedSensor
      ? 'active-power/aggregated'
      : 'active-power/raw'
    // Distribution of last hour
    const after = this.timeMode.getTime().minus({ hours: 1 })
    const to = this.timeMode.getTime()
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
        for (const bucket of response.data) {
          const xLabel = Math.round(
            (parseFloat(bucket.lower) + parseFloat(bucket.upper)) / 2)
            .toString()
          const tooltipLabel = `${bucket.lower.toFixed(1)} – ${bucket.upper.toFixed(1)}`
          if (!isNaN(bucket.elements)) {
            barData.push({
              name: xLabel,
              tooltipLabel: tooltipLabel,
              value: bucket.elements.toFixed(0)
            })
          }
        }
        return barData
      })
      .catch(e => {
        console.error(e)
        this.isError = true
        return [{ name: this.sensor.identifier, value: 0 }]
      })
      .then(data => {
        this.tooltip.nameLabel('tooltipLabel')
        this.container.datum(data).call(this.barChart)
        const tooltipContainer = d3select('.histogram .bar-chart .metadata-group')
        tooltipContainer.datum([]).call(this.tooltip)
        this.isLoading = false
      })
  }
}
</script>

<style scoped>
  .histogram {
    height: 300px;
  }
</style>
