<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Active Power Consumption</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="canvasplot-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import debounce from 'lodash.debounce'

import { Sensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'
import { TimeSeriesPlotManager } from '@/model/TimeSeriesPlotManager'
import { CanvasTimeSeriesPlot } from '@/model/canvasPlot/CanvasTimeSeriesPlot'

import LoadingSpinner from './LoadingSpinner.vue'

declare const d3version3: any // eslint-disable-line @typescript-eslint/no-explicit-any

@Component({
  components: {
    LoadingSpinner
  }
})
export default class SensorHistoryPlot extends Vue {
  @Prop({ required: true }) sensor!: Sensor

  @Prop({ required: true }) timeMode!: TimeMode

  private isLoading = false
  private isError = false

  private plot!: CanvasTimeSeriesPlot // Will definitely be assigned in mounted
  private plotManager!: TimeSeriesPlotManager;

  private readonly onSizeChanged = debounce(this.createPlot, 100)

  get canvasplotContainer () {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.$el.querySelector('.canvasplot-container')! as HTMLElement
  }

  mounted () {
    this.createPlot()
    window.addEventListener('resize', this.onSizeChanged)
  }

  destroyed () {
    window.removeEventListener('resize', this.onSizeChanged)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.createPlot()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.createPlot()
  }

  private createPlot () {
    this.plot && this.plot.destroy()

    const dimensions = [this.canvasplotContainer.clientWidth, this.canvasplotContainer.clientHeight]
    this.plot = new CanvasTimeSeriesPlot(
      d3version3.select(this.canvasplotContainer),
      dimensions,
      {
        plotStartsWithZero: true,
        yAxisLabel: 'Active Power in Watt',
        numberOfResolutionLevels: 3,
        disableLegend: true,
        plotLineWidth: 1.5,
        markerFill: true,
        areaFillGradient: true
      }
    )
    this.plot.setZoomYAxis(false)
    this.isLoading = true
    this.plotManager = new TimeSeriesPlotManager({
      plot: this.plot,
      sensor: this.sensor,
      timeMode: this.timeMode,
      onFinishedLoading: () => { this.isLoading = false },
      color: '#7bdcc0'
    })
  }
}
</script>

<style scoped>
  .canvasplot-container {
    height: 400px;
    overflow: hidden;
  }
</style>
