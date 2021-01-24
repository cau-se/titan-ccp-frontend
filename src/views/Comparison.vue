<template>
  <div>
    <b-container v-if="plots.length > 0">
      <comparison-setting-header
        :timeMode="timeMode"
        :resolution="resolution"
        :availableResolutions="availableResolutions"
        :range="range"
        @update-resolution="updateResolution"
        @update-range="updateRange"
        class="mb-3"
      />
      <comparison-plot
        v-for="plot in plots"
        :key="plot"
        :sensorRegistry="sensorRegistry"
        :resolution="resolution"
        :range="range"
        :domainX="domainX"
        :colors="colorRepository"
        @remove="removePlot(plot)"
        @update-domain-x="updateDomainX"
        class="mb-3"
      />
      <b-row>
        <b-col>
          <b-button variant="success" @click="addPlot">Add Plot</b-button>
        </b-col>
      </b-row>
    </b-container>
    <b-container v-else class="empty-container text-center">
      <font-awesome-icon icon="chart-line" class="empty-icon" />
      <br />
      <b-button variant="success" size="lg" @click="addPlot">Add Plot</b-button>
    </b-container>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

// import { faClosedCaptioning } from '@fortawesome/free-solid-svg-icons'
import { Interval } from 'luxon'
import ColorRepository from '@/model/ColorRepository'
import { HTTP } from '@/model/http-common'
import TimeMode from '@/model/time-mode'
import { Resolution, RawResolution, ScalingResolution, WindowedResolution } from '@/model/resolution'
import { SensorRegistry } from '@/model/SensorRegistry'

import ComparisonPlot from '@/components/ComparisonPlot.vue'
import ComparisonSettingHeader from '@/components/ComparisonSettingHeader.vue'

import env from '@/util/Env'

/* class Plot {
  readonly dataSets = new Array<DataSet>();

  newDataSet = '';

  constructor (readonly id: number) {}
} */

/* class DataSet {
  // eslint-disable-next-line no-useless-constructor
  constructor (readonly sensor: string) {}
} */

@Component({
  components: {
    ComparisonPlot,
    ComparisonSettingHeader
  }
})
export default class Comparision extends Vue {
  static readonly UNIT_FACTOR = parseFloat(env('VUE_APP_UNIT_FACTOR', '1'))
  static readonly DEFAULT_RESOLUTION = new ScalingResolution(new RawResolution(), Comparision.UNIT_FACTOR);

  @Prop({ required: true }) sensorRegistry!: SensorRegistry;

  @Prop({ required: true }) timeMode!: TimeMode;

  private resolution: Resolution = Comparision.DEFAULT_RESOLUTION;

  private range: Interval = Interval.fromDateTimes(
    this.timeMode.getTime().minus({ days: 7 }),
    this.timeMode.getTime()
  );

  private availableResolutions: Resolution[] = [
    Comparision.DEFAULT_RESOLUTION
    // new WindowedResolution('minutely'),
    // new WindowedResolution('hourly')
    // new WindowedResolution('daily'),
  ];

  private plots = new Array<number>();

  private nextPlotId = 0;

  colorRepository = new ColorRepository();

  domainX = new Array<Date>();

  mounted () {
    this.loadAvailableResolutions()
      .then(resolutions => resolutions.forEach(
        res => this.availableResolutions.push(res)))
  }

  addPlot () {
    this.plots.push(this.nextPlotId)
    this.nextPlotId++
  }

  removePlot (plot: number) {
    this.plots.splice(this.plots.indexOf(plot), 1)
  }

  updateDomainX (domainX?: Array<Date>) {
    if (domainX) {
      this.domainX = domainX
      // console.log(this.domainX)
    }
  }

  private async loadAvailableResolutions (): Promise<Resolution[]> {
    return HTTP.get('active-power/windowed').then(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (response: any) => response.data.map((i: string) => new ScalingResolution(new WindowedResolution(i), Comparision.UNIT_FACTOR))
    )
  }

  private updateResolution (resolution: Resolution) {
    this.resolution = resolution
  }

  private updateRange (range: Interval) {
    this.range = range
  }
}

</script>

<style scoped>
.empty-container {
  padding-top: 4em;
}
.empty-icon {
  color: rgba(0, 0, 0, 0.2);
  font-size: 16em;
}

.center {
  text-align: center;
  margin: auto;
}
</style>
