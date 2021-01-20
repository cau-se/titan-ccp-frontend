<template>
    <div>
        <b-container>
            <b-row class="mb-4">
                <b-col cols ="6">
                    <h2>Anomalies</h2>
                </b-col>
                <b-col cols ="3" class="text-right">
                    <b-form inline>
                        <label for="inline-form-input-name">Threshold:</label>
                        <b-input id="inline-form-input-name" v-model="threshold" style="width: 3em;"></b-input>
                    </b-form>
                </b-col>
                <b-col cols ="3" class="text-right">
                    <treeselect
                        v-model="internalSensor"
                        :options="[ this.sensorRegistry.topLevelSensor ]"
                        :normalizer="covertSensorToSelectable"
                        :clearable="false"
                        valueFormat="object"
                    />
                </b-col>
            </b-row>
            <b-row class="mb-4">
                <b-col>
                    <!--<sensor-history-plot :sensor="internalSensor" :timeMode="timeMode"  :key="internalSensor.identifier" />-->
                    <div class="card">
                        <div class="card-body">
                        <loading-spinner :is-loading="isLoading" :is-error="isError">
                            <div class="canvasplot-container"></div>
                        </loading-spinner>
                        </div>
                    </div>
                </b-col>
            </b-row>
            <b-row class="mb-4">
                <b-col>
                    <anomaly-view :sensor="internalSensor" :timeMode="timeMode" :interval="interval" :threshold="threshold" />
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Sensor, AggregatedSensor, MachineSensor, SensorRegistry } from '@/model/SensorRegistry'

import { HTTP } from '@/model/http-common'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'

import SensorHistoryPlot from './SensorHistoryPlot.vue'
import TimeMode from '../model/time-mode'
import AnomalyView from './AnomalyView.vue'
import LoadingSpinner from './LoadingSpinner.vue'

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { CanvasTimeSeriesPlot } from '@/model/canvasPlot/CanvasTimeSeriesPlot'
import { Interval } from 'luxon'
import { DataPoint, TimeSeriesPlotManager } from '@/model/TimeSeriesPlotManager'
import d3 from 'd3'
declare let d3version3: any

@Component({
  components: {
    SensorHistoryPlot,
    LoadingSpinner,
    AnomalyView,
    Treeselect
  }
})
export default class Anomalies extends Vue {
    @Prop({ required: true }) sensorRegistry!: SensorRegistry;

    @Prop({ required: true }) timeMode!: TimeMode

    private internalSensor: Sensor = this.sensorRegistry.topLevelSensor

    private threshold = 3;
    private plot!: CanvasTimeSeriesPlot // Will definitely be assigned in mounted
    private plotManager!: TimeSeriesPlotManager;

    private get interval (): Interval {
      return Interval.fromDateTimes(
        this.timeMode.getTime().minus({ minutes: 40 }),
        this.timeMode.getTime()
      )
    }

    covertSensorToSelectable (sensor: Sensor) {
      if (sensor instanceof AggregatedSensor) {
        return {
          id: sensor.identifier,
          label: sensor.title,
          children: sensor.children
        }
      } else {
        return {
          id: sensor.identifier,
          label: sensor.title
        }
      }
    }

    private isLoading = false;
    private isError = false;

    get canvasplotContainer () {
      return this.$el.querySelector('.canvasplot-container')! as HTMLElement
    }

    mounted () {
      this.fetchHistoryData()
    }

    @Watch('timeMode')
    ontimeModeChanged () {
      this.fetchHistoryData()
    }

    private fetchHistoryData () {
      this.plot && this.plot.destroy()

      const dimensions = [this.canvasplotContainer.clientWidth, this.canvasplotContainer.clientHeight]
      this.plot = new CanvasTimeSeriesPlot(
        d3version3.select(this.canvasplotContainer),
        dimensions,
        {
          plotStartsWithZero: true,
          yAxisLabel: 'Active Power in kW',
          numberOfResolutionLevels: 3,
          disableLegend: true
        }
      )
      this.plot.setZoomYAxis(false)
      this.isLoading = true
      this.plotManager = new TimeSeriesPlotManager({
        plot: this.plot,
        sensor: this.internalSensor,
        timeMode: this.timeMode,
        onFinishedLoading: () => { this.isLoading = false }
      })
    }
}
</script>

<style scoped>
.canvasplot-container {
  height: 300px;
}
</style>
