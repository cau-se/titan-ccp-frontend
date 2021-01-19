<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Composition</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="donut-container"></div>
        <div class="js-inline-legend-chart-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { select as d3select, Selection } from 'd3-selection'
import colors from 'britecharts/dist/umd/colors.min'
import donut from 'britecharts/dist/umd/donut.min'
import legend from 'britecharts/dist/umd/legend.min'
import 'britecharts/dist/css/charts/bar.min.css'
import debounce from 'lodash.debounce'

import Registry from '@/util/Registry'
import { HTTP } from '@/model/http-common'
import { AggregatedSensor, MachineSensor, Sensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

interface CompositionShare {
  sensor: Sensor;
  valueInW: number;
}

@Component({
  components: {
    LoadingSpinner
  }
})
export default class CompositionChart extends Vue {
  @Prop({ required: true }) sensor!: AggregatedSensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private donutChart!: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private legendChart!: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private container!: Selection<HTMLElement, any, HTMLElement, any>
  private readonly onSizeChanged = debounce(this.redrawChart, 200)
  private readonly idRegistry = new Registry<string>()

  mounted () {
    // eslint-disable-next-line new-cap
    this.donutChart = new donut()
    this.container = d3select('.donut-container')
    this.computeChartSize()
    this.donutChart
      .isAnimated(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('customMouseOver', (data: any) => {
        this.legendChart.highlight(data.data.id)
      })
      .on('customMouseOut', () => {
        this.legendChart.clearHighlight()
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('customClick', (slice: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const clickedSensor = this.idRegistry.get(slice.data.id)
        this.$router.push({
          path: `/sensor-details/${[...this.sensor.allParents, this.sensor].map(s => s.identifier).join('/')}/${clickedSensor}`
        })
      })
    this.updateChart()
    window.addEventListener('resize', this.onSizeChanged)
  }

  destroyed () {
    window.removeEventListener('resize', this.onSizeChanged)
  }

  private redrawChart () {
    this.computeChartSize()
    this.container.call(this.donutChart)
  }

  private computeChartSize () {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const containerWidth = this.container.node()!.getBoundingClientRect().width
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const containerHeight = this.container.node()!.getBoundingClientRect().height
    const donutRadius = Math.min(containerWidth, containerHeight) / 2
    this.donutChart
      .width(containerWidth)
      .internalRadius(donutRadius * 0.5)
      .externalRadius(donutRadius)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.updateChart()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.updateChart()
  }

  private loadAggregatedSensor (sensor: AggregatedSensor): Promise<Array<CompositionShare>> {
    const to = this.timeMode.getTime()

    return Promise.all(sensor.children.map(child => {
      const resource = child instanceof AggregatedSensor ? 'active-power/aggregated' : 'active-power/raw'
      return HTTP.get(resource + '/' + child.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          // JSON responses are automatically parsed.
          let value
          if (response.data.length <= 0) {
            value = 0
          } else if (child instanceof AggregatedSensor) {
            value = response.data[0].sumInW
          } else if (child instanceof MachineSensor) {
            value = response.data[0].valueInW
          } else {
            value = 0
          }
          return { sensor: child, valueInW: value } as CompositionShare
        })
    }))
      .catch(e => {
        console.error(e)
        this.isError = true
        return []
      })
  }

  private drawDonut (shares: Array<CompositionShare>) {
    const donutData = shares.map(share => ({
      quantity: share.valueInW,
      name: share.sensor.title,
      id: this.idRegistry.register(share.sensor.identifier)
    }))

    this.isLoading = false
    this.legendChart = this.getLegendChart(donutData, colors.colorSchemas.britecharts)
    this.container.datum(donutData).call(this.donutChart)
  }

  private updateChart () {
    this.isLoading = true
    this.loadAggregatedSensor(this.sensor)
      .then(this.drawDonut)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLegendChart (dataset: Array<{quantity: number; name: string; id: number}>, optionalColorSchema: any) {
    // eslint-disable-next-line new-cap
    const legendChart = new legend()
    const legendContainer = d3select('.js-inline-legend-chart-container')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerWidth = legendContainer.node() ? (legendContainer.node() as any).getBoundingClientRect().width : false

    if (containerWidth) {
      d3select('.js-inline-legend-chart-container .britechart-legend').remove()
      legendChart
        .width(containerWidth)
        .height(30)
        .numberFormat('s')
        .isHorizontal(true)
        .markerSize(10)
      if (optionalColorSchema) {
        legendChart.colorSchema(optionalColorSchema)
      }
      legendContainer.datum(dataset).call(legendChart)
      return legendChart
    }
  }
}
</script>

<style scoped>
  .donut-container {
    height: 280px;
  }
  .donut-container >>> svg g.arc path {
    cursor: pointer;
  }
  .js-inline-legend-chart-container {
    padding-top: 20px;
    height: 0px;
  }
</style>
