<template>
  <div class="card-group row no-gutters">
    <div class="card col-9">
      <div class="canvasplot-container"></div>
    </div>
    <div class="card col-3">
      <div class="card-header">
        Data Sets
        <b-button-close @click="remove()" />
      </div>
      <ul class="list-group list-group-flush">
        <li v-for="dataSet in dataSets" :key="dataSet.sensor" class="list-group-item">
          {{ dataSet.sensor.title }}
          <b-button-close @click="removeDataSet(dataSet)" />
        </li>
        <li class="list-group-item">
          <b-button
            variant="success"
            v-if="!addDataSetActive"
            @click="addDataSetActive = true"
          >Add Data Set</b-button>
          <treeselect
            v-else
            v-model="newDataSet"
            :options="[ this.sensorRegistry.topLevelSensor ]"
            :normalizer="covertSensorToSelectable"
            :clearable="false"
            valueFormat="object"
            @input="addDataSet()"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { HTTP } from "../http-common";
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry
} from "../SensorRegistry";
import ColorRepository from "../ColorRepository";
// @ts-ignore
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
// @ts-ignore
import { CanvasTimeSeriesPlot } from "../canvasplot.js";
import { DataPoint } from "../MovingTimeSeriesPlot";
import ComparisonSettingBar from "./../model/comparison-view-settings";

// import { watch } from "fs";
declare var d3version3: any;

@Component({
  components: {
    Treeselect
  }
})
export default class ComparisonPlot extends Vue {
  readonly after = new Date().getTime() - 1 * 3600 * 1000;

  // TODO: readonly
  dataSets = new Array<DataSet>();

  newDataSet: Sensor | null = null;

  addDataSetActive = false;

  value = null;

  get options() {
    return [this.sensorRegistry.topLevelSensor];
  }

  @Prop({ required: true })
  sensorRegistry!: SensorRegistry;

  @Prop() domainX!: Array<Date>;

  @Prop()
  colors!: ColorRepository;

  private plot!: CanvasTimeSeriesPlot; // Will definitely be assigned in mounted

  private dateRange = {
    startDate: null,
    endDate: null
  };

  private resolution: any = 0;

  get canvasplotContainer() {
    return this.$el.querySelector(".canvasplot-container")!;
  }

  covertSensorToSelectable(sensor: Sensor) {
    if (sensor instanceof AggregatedSensor) {
      return {
        id: sensor.identifier,
        label: sensor.title,
        children: sensor.children
      };
    } else {
      return {
        id: sensor.identifier,
        label: sensor.title
      };
    }
  }

  mounted() {
    this.plot = new CanvasTimeSeriesPlot(
      d3version3.select(this.canvasplotContainer),
      [
        this.canvasplotContainer.clientWidth,
        this.canvasplotContainer.clientHeight
      ],
      {
        //plotMargins: { top: 20, right: 20, bottom: 30, left: this.yAxisSpacing },
        updateViewCallback: this.updatedView.bind(this)
      }
    );
    this.plot.setZoomYAxis(false);
  }

  remove() {
    this.$emit("remove");
  }

  removeDataSet(dataSet: DataSet) {
    this.dataSets.splice(this.dataSets.indexOf(dataSet), 1);
    this.colors.free(dataSet.sensor.identifier);
    this.plot.removeDataSet(dataSet.sensor.identifier);
  }

  async addDataSet() {
    if (this.newDataSet) {
      let dataSet = new DataSet(this.newDataSet);
      this.dataSets.push(dataSet);
      this.newDataSet = null;
      this.addDataSetActive = false;

      let color = this.colors.get(dataSet.sensor.identifier);
      let updateDomains = true;
      let dataPoints = await this.fetchNewData(dataSet.sensor);
      this.plot.addDataSet(
        dataSet.sensor.identifier,
        dataSet.sensor.title,
        dataPoints.map(dataPoint => dataPoint.toArray()),
        color,
        updateDomains,
        false
      );
    }
  }

  async refreshDataSet(dataSet: DataSet) {
    this.dataSets.push(dataSet);
    let color = this.colors.get(dataSet.sensor.identifier);
    let updateDomains = true;
    let dataPoints = await this.fetchNewData(dataSet.sensor);
    this.plot.addDataSet(
      dataSet.sensor.identifier,
      dataSet.sensor.title,
      dataPoints.map(dataPoint => dataPoint.toArray()),
      color,
      updateDomains,
      false
    );
  }

  updatedView(except: any, xDomain: any, yDomain: any) {
    this.$emit("update-domain-x", xDomain);
  }

  @Watch("domainX")
  syncView() {
    let currentXDomain = this.plot.getXDomain();
    if (
      currentXDomain[0].getTime() != this.domainX[0].getTime() ||
      currentXDomain[1].getTime() != this.domainX[1].getTime()
    ) {
      this.plot.updateDomains(this.domainX, this.plot.getYDomain(), false);
    }
  }

  private updateDataSet(startDate: any, endDate: any, resolution: string) {
    this.dateRange.startDate = startDate;
    this.dateRange.endDate = endDate;
    this.resolution = resolution;
    let tmp = this.dataSets;
    for (var i = 0; i < tmp.length; i++) {
      let dataSet = tmp[i];
      this.removeDataSet(dataSet);
      this.refreshDataSet(dataSet);
    }
  }

  private fetchNewData(sensor: Sensor): Promise<DataPoint[]> {
    let resource = "";
    if (this.resolution == "1:1") {
      resource =
        sensor instanceof AggregatedSensor
          ? "aggregated-power-consumption"
          : "power-consumption";
    } else {
      resource = "active-power";
    }

    return HTTP.get(
      resource +
        (this.resolution != "1:1"
          ? "/windowed/" + this.resolution + "/"
          : "/") +
        sensor.identifier +
        "?from=" +
        this.dateRange.startDate +
        "&to=" +
        this.dateRange.endDate
    )
      .then(response => {
        // JSON responses are automatically parsed.
        // TODO access sum generically
        return response.data.map(
          (x: any) =>
            new DataPoint(
              new Date(
                this.resolution == "1:1" ? x.timestamp : x.startTimestamp
              ),
              this.resolution == "1:1"
                ? sensor instanceof AggregatedSensor
                  ? x.sumInW
                  : x.valueInW
                : x.max
            )
        );
      })
      .catch(e => {
        console.error(e);
        return [];
      });
  }
}

class DataSet {
  constructor(readonly sensor: Sensor) {}
}
</script>

<style scoped>
.canvasplot-container {
  height: 300px;
}
.card-group {
  width: 100%;
}
.card-body {
  width: 100%;
}
</style>