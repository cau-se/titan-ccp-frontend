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

import { select as d3select } from 'd3-selection'
import colors from 'britecharts/dist/umd/colors.min'
import donut from 'britecharts/dist/umd/donut.min'
import legend from 'britecharts/dist/umd/legend.min'
import 'britecharts/dist/css/charts/bar.min.css'
import debounce from 'lodash.debounce'

import { HTTP } from '@/model/http-common'
import { AggregatedSensor, MachineSensor, Sensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class CompositionDonutChart extends Vue {
  @Prop({ required: true }) sensor!: Sensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private donutChart!: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private legendChart!: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private container!: d3.Selection<HTMLElement, any, HTMLElement, any>
  private containerWidth!: number
  private readonly onSizeChanged = debounce(this.redrawChart, 200)

  mounted () {
    // eslint-disable-next-line new-cap
    this.donutChart = new donut()
    this.container = d3select('.donut-container')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.containerWidth = this.container.node()!.getBoundingClientRect().width
    this.donutChart
      .width(this.containerWidth)
      .externalRadius(this.containerWidth / 3.3)
      .internalRadius(this.containerWidth / 5.5)
      .isAnimated(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('customMouseOver', (data: any) => {
        this.legendChart.highlight(data.data.id)
      })
      .on('customMouseOut', () => {
        this.legendChart.clearHighlight()
      })
    this.updateChart()
    window.addEventListener('resize', this.onSizeChanged)
  }

  destroyed () {
    window.removeEventListener('resize', this.onSizeChanged)
  }

  // make the chart responsive
  private redrawChart () {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newContainerWidth = this.container.node() ? this.container.node()!.getBoundingClientRect().width : false
    this.donutChart.width(newContainerWidth)
    this.container.call(this.donutChart)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.updateChart()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.updateChart()
  }

  private loadMashineSensor (sensor: MachineSensor): Promise<[string, number][]> {
    const to = this.timeMode.getTime()

    return Promise.all([
      HTTP.get('active-power/raw/' + sensor.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          return [this.sensor.name, response.data.length <= 0 ? 0 : response.data[0].valueInW] as [string, number]
        }),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      HTTP.get('active-power/aggregated/' + this.sensor.parent!.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          return ['other', response.data.length <= 0 ? 0 : response.data[0].sumInW] as [string, number]
        })
    ])
      .catch(e => {
        console.error(e)
        this.isError = true
        return []
      })
  }

  private loadAggregatedSensor (sensor: AggregatedSensor): Promise<[string, number][]> {
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
          } else {
            value = response.data[0].valueInW
          }
          return [child.title, value] as [string, number]
        })
    }))
      .catch(e => {
        console.error(e)
        this.isError = true
        return []
      })
  }

  get isAggregated () {
    return this.sensor instanceof AggregatedSensor
  }

  private drawDonut (columns: [string, number][]) {
    const donutData: Array<{quantity: number; percentage: number; name: string; id: number}> = []
    this.donutChart
      .highlightSliceById(this.isAggregated ? false : 1)
      .hasFixedHighlightedSlice(this.isAggregated)
    let sum = 0
    let id = 1
    for (let i = 0; i < columns.length; i++) {
      sum += columns[i][1]
    }
    for (let i = 0; i < columns.length; i++) {
      let percentage = (columns[i][1] / sum) * 100
      percentage = parseFloat(percentage.toFixed(1))
      donutData.push({ quantity: columns[i][1], percentage: percentage, name: columns[i][0], id: id })
      id++
    }
    this.isLoading = false
    this.legendChart = this.getLegendChart(donutData, colors.colorSchemas.britecharts)
    this.container.datum(donutData).call(this.donutChart)
  }

  private updateChart () {
    this.isLoading = true
    if (this.isAggregated) {
      const aggsensor = this.sensor as AggregatedSensor
      this.loadAggregatedSensor(aggsensor)
        .then(this.drawDonut)
    } else {
      this.loadMashineSensor(this.sensor)
        .then(this.drawDonut)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getLegendChart (dataset: Array<{quantity: number; percentage: number; name: string; id: number}>, optionalColorSchema: any) {
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
    height: 300px;
  }
  .js-inline-legend-chart-container {
    height: 0px;
  }
</style>
