<template>
  <div>
    <div>
      <comparison-setting-header @updatedViewSettings="changeViewSettings"></comparison-setting-header>
    </div>
    <b-container v-if="plots.length > 0" class>
      <comparison-plot
        ref="comp"
        v-for="plot in plots"
        :key="plot"
        :sensorRegistry="sensorRegistry"
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
import ComparisonSettingBar from "./../model/comparison-view-settings";
import DateRangePicker from "vue2-daterange-picker";
import "vue2-daterange-picker/dist/vue2-daterange-picker.css";
import { start } from "repl";

@Component({
  components: {
    ComparisonPlot,
    ComparisonSettingHeader,
    DateRangePicker
  },
  filters: {
    date(value: any) {
      if (!value) return "";

      let options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric"
      };
      return Intl.DateTimeFormat("en-EN", options).format(value);
    }
  }
})
export default class Comparision extends Vue {
  @Prop({ required: true })
  sensorRegistry!: SensorRegistry;

  private dateRange = { startDate: "", endDate: "" };
  private from: any;
  private to: any;
  private resolution: number = 1;

  private plots = new Array<number>();

  private nextPlotId = 0;

  colorRepository = new ColorRepository();

  domainX = new Array<Date>();

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

  private changeViewSettings(startDate: any, endDate: any, resolution: any) {
    console.log(new Date(startDate).getTime());
    console.log(new Date(endDate).getTime());
    this.$refs.comp[0].updateDataSet(
      new Date(startDate).getTime(),
      new Date(endDate).getTime(),
      resolution
    );
  }

  private setResolution() {}
}

class Plot {
  readonly dataSets = new Array<DataSet>();

  newDataSet = "";

  constructor(readonly id: number) {}
}

class DataSet {
  constructor(readonly sensor: string) {}
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