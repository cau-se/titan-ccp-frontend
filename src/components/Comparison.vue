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
      />
      <comparison-plot
        ref="comp"
        v-for="plot in plots"
        :key="plot"
        :sensorRegistry="sensorRegistry"
        :resolution="resolution"
        :range="range"
        :domainX="domainX"
        :colors="colorRepository"
        @remove="removePlot(plot)"
        @update-domain-x="updateDomainX"
        class="mb-4"
      />
      <b-row class="mb-4">
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
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry
} from "../SensorRegistry";

import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ComparisonPlot from "./ComparisonPlot.vue";
import ComparisonSettingHeader from "./ComparisonSettingHeader.vue";
import ColorRepository from "../ColorRepository";
import { faClosedCaptioning } from "@fortawesome/free-solid-svg-icons";

import { HTTP } from "../http-common";
import TimeMode from "../model/time-mode";
import { DateTime, Interval } from "luxon";

@Component({
  components: {
    ComparisonPlot,
    ComparisonSettingHeader
  }
})
export default class Comparision extends Vue {

  private readonly DEFAULT_RESOLUTION = new RawResolution();

  @Prop({ required: true }) sensorRegistry!: SensorRegistry;
  
  @Prop({ required: true }) timeMode!: TimeMode;

  private resolution = this.DEFAULT_RESOLUTION;

  private range: Interval = Interval.fromDateTimes(
    this.timeMode.getTime().minus({ days: 7 }),
    this.timeMode.getTime()
  );

  private availableResolutions: Resolution[] = [
    this.DEFAULT_RESOLUTION,
    //new WindowedResolution("minutely"),
    //new WindowedResolution("hourly")
    //new WindowedResolution("daily"),
    ];

  private plots = new Array<number>();

  private nextPlotId = 0;

  colorRepository = new ColorRepository();

  domainX = new Array<Date>();

  mounted() {
    this.loadAvailableResolutions()
      .then(resolutions => resolutions.forEach(
        res => this.availableResolutions.push(res)));
  }

  addPlot() {
    this.plots.push(this.nextPlotId);
    this.nextPlotId++;
  }

  removePlot(plot: number) {
    this.plots.splice(this.plots.indexOf(plot), 1);
  }

  updateDomainX(domainX?: Array<Date>) {
    if (domainX) {
      this.domainX = domainX;
      //console.log(this.domainX)
    }
  }

  private async loadAvailableResolutions(): Promise<Resolution[]> {
    return HTTP.get('active-power/windowed').then(
      response => response.data.map((i: string) => new WindowedResolution(i))
    );
  }

  private updateResolution(resolution: Resolution) {
    this.resolution = resolution;
  }

  private updateRange(range: Interval) {
    this.range = range;
  }
}

class Plot {
  readonly dataSets = new Array<DataSet>();

  newDataSet = "";

  constructor(readonly id: number) {}
}

class DataSet {
  constructor(readonly sensor: string) {}
}

export interface Resolution {

  getQueryUrl(sensor: Sensor, range: Interval): string;

  name: string;

  valueAccessor: (json: any, sensor: Sensor) => number

  timestampAccessor: (json: any, sensor: Sensor) => Date

}

export class RawResolution implements Resolution {
  
  constructor() {}

  name = "highest"

  valueAccessor = (json, sensor) => sensor instanceof AggregatedSensor ? json.sumInW : json.valueInW;

  timestampAccessor = (json, _) => new Date(json.timestamp);

  getQueryUrl(sensor: Sensor, range: Interval) {
    return `${sensor instanceof AggregatedSensor ? "aggregated-power-consumption" : "power-consumption"}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`;
  }

}

export class WindowedResolution implements Resolution {
  
  constructor(readonly name: string) {}

  valueAccessor = (json, _) => json.mean;

  timestampAccessor = (json, _) => new Date(json.startTimestamp);

  getQueryUrl(sensor: Sensor, range: Interval) {
    return `active-power/windowed/${this.name}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`;
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