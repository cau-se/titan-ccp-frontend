<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Contribution</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="donut-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { select as d3select, Selection } from 'd3-selection'
// import colors from 'britecharts/dist/umd/colors.min'
import donut from 'britecharts/dist/umd/donut.min'
import 'britecharts/dist/css/charts/bar.min.css'
import debounce from 'lodash.debounce'

import { HTTP } from '@/model/http-common'
import { MachineSensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from '@/components/LoadingSpinner.vue'

class ContributionData {
  // eslint-disable-next-line no-useless-constructor
  constructor (readonly share: number, readonly total: number) {}

  get nonShare (): number {
    return this.total - this.share
  }
}

@Component({
  components: {
    LoadingSpinner
  }
})
export default class ContributionChart extends Vue {
  @Prop({ required: true }) sensor!: MachineSensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private donutChart!: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private container!: Selection<HTMLElement, any, HTMLElement, any>
  private readonly onSizeChanged = debounce(this.redrawChart, 200)

  mounted () {
    // eslint-disable-next-line new-cap
    this.donutChart = new donut()
    this.container = d3select('.donut-container')
    this.computeChartSize()
    this.donutChart
      .isAnimated(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .orderingFunction((a: any, b: any) => a.id - b.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('customClick', (slice: any) => {
        const clickedSensor = slice.data.id
        if (clickedSensor !== this.sensor.identifier) {
          this.$router.push({
            path: `/sensor-details/${this.sensor.allParents.map(s => s.identifier).join('/')}`
          })
        }
      })
    this.updateChart()
    window.addEventListener('resize', this.onSizeChanged)
  }

  destroyed () {
    window.removeEventListener('resize', this.onSizeChanged)
  }

  // make the chart responsive
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

  private loadMaschineSensor (sensor: MachineSensor): Promise<ContributionData> {
    const to = this.timeMode.getTime()

    return Promise.all([
      HTTP.get('active-power/raw/' + sensor.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          return response.data.length <= 0 ? 0 : response.data[0].valueInW
        }),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      HTTP.get('active-power/aggregated/' + this.sensor.parent!.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          return response.data.length <= 0 ? 0 : response.data[0].sumInW
        })
    ])
      .then(results => new ContributionData(results[0], results[1]))
      .catch(e => {
        console.error(e)
        this.isError = true
        return new ContributionData(0, 0)
      })
  }

  private drawDonut (data: ContributionData) {
    const donutData: Array<{quantity: number; name: string; id: string}> = []
    donutData.push({
      quantity: data.share,
      name: this.sensor.title,
      id: this.sensor.identifier
    })
    donutData.push({
      quantity: data.nonShare,
      // name: 'Other in ' + this.sensor.parent?.name,
      name: 'Others',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: this.sensor.parent!.identifier
    })

    this.donutChart
      .highlightSliceById(this.sensor.identifier)
      .hasFixedHighlightedSlice(true)

    this.isLoading = false
    this.container.datum(donutData).call(this.donutChart)
  }

  private updateChart () {
    this.isLoading = true
    this.loadMaschineSensor(this.sensor).then(this.drawDonut)
  }
}
</script>

<style scoped>
  .donut-container {
    height: 300px;
    overflow: hidden;
  }
  .donut-container >>> svg g.arc:not(:first-child) path {
    cursor: pointer;
  }
</style>
