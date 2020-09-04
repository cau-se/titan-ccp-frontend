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
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { HTTP } from "../http-common";
import { Sensor, AggregatedSensor } from "../SensorRegistry";
import LoadingSpinner from "./LoadingSpinner.vue";
// @ts-ignore
import { CanvasTimeSeriesPlot } from "../canvasplot.js";
import { MovingTimeSeriesPlot, DataPoint } from "../MovingTimeSeriesPlot";
import Repeater from "../Repeater";
import { DateTime } from "luxon";
import TimeMode from "../model/time-mode";

@Component({
  components: {
    LoadingSpinner,
  },
})
export default class SensorHistoryPlot extends Vue {
  private refreshIntervalInMs = 1000;

  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ required: true }) timeMode!: TimeMode;

  private timeOffset: number = 0;

  private dataPoints: any[] = [];

  private latest = this.completeHistory
    ? 0
    : this.timeMode.getTime().toMillis() - 3600 * 1000;

  private isLoading = false;
  private isError = false;

  private plot!: MovingTimeSeriesPlot; // Will definitely be assigned in mounted

  private requester = new Repeater(
    this.createPlot,
    this.updatePlot,
    this.refreshIntervalInMs
  );

  get canvasplotContainer() {
    return this.$el.querySelector(".canvasplot-container")! as HTMLElement;
  }

  get completeHistory() {
    return true;
    //console.log("SHOW_COMPLETE_HISTORY " + process.env.SHOW_COMPLETE_HISTORY);
    //return process.env.SHOW_COMPLETE_HISTORY === "true"
  }

  created() {}

  mounted() {
    this.requester.start();
  }

  destroyed() {
    this.requester.stop();
  }

  @Watch("sensor")
  onSensorChanged(sensor: Sensor) {
    this.destroyPlot();
    this.requester.restart();
  }

  @Watch("timeMode")
  onTimeModeChanged() {
    this.destroyPlot();
    if (this.timeMode.autoLoading) {
      this.requester.restart();
    } else {
      this.requester.stop();
      this.createPlot();
    }
  }

  private createPlot() {
    this.plot = new MovingTimeSeriesPlot(this.canvasplotContainer, {
      plotStartsWithZero: true,
      yAxisLabel: "Active Power in kW",
    });
    // BETTER fetch already earlier and then wait for mount
    this.isLoading = true;
    return this.fetchNewData()
      .catch((e) => {
        console.error(e);
        this.isError = true;
        return [];
      })
      .then((dataPoints) => {
        if (!this.timeMode.autoLoading) {
          new Promise<DataPoint[]>((resolve, reject) => {
            let acc: DataPoint[] = [];
            for (let point of dataPoints) {
              if (point.date.getTime() < this.timeMode.getTime().toMillis()) {
                acc.push(point);
              } else break;
            }
            return resolve(acc);
          }).then((points) => {
            this.plot.setDataPoints(points);
            this.isLoading = false;
          });
        } else {
          this.plot.setDataPoints(dataPoints);
          this.isLoading = false;
        }
      });
  }

  private updatePlot() {
    if (this.timeMode.autoLoading) {
      this.fetchNewData().then((dataPoints) =>
        this.plot.addDataPoints(dataPoints)
      );
    }
  }

  private destroyPlot() {
    this.latest = this.completeHistory
      ? 0
      : this.timeMode.getTime().toMillis() - 3600 * 1000;
    this.isLoading = false;
    this.isError = false;
    this.plot.destroy();
  }

  private fetchNewData(): Promise<DataPoint[]> {
    let resource =
      this.sensor instanceof AggregatedSensor
        ? "aggregated-power-consumption"
        : "power-consumption";
    return HTTP.get(
      resource + "/" + this.sensor.identifier + "?after=" + this.latest
    ).then((response) => {
      // JSON responses are automatically parsed.
      if (response.data.length > 0) {
        this.latest = response.data[response.data.length - 1].timestamp;
      }
      // TODO access sum generically
      return response.data.map(
        (x: any) =>
          new DataPoint(
            new Date(x.timestamp),
            this.sensor instanceof AggregatedSensor ? x.sumInW : x.valueInW
          )
      );
    });
  }
}
</script>

<style scoped>
.canvasplot-container {
  height: 400px;
}
</style>