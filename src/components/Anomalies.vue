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
import { Vue, Component, Prop, Watch } from "vue-property-decorator"
import { Sensor, AggregatedSensor, MachineSensor, SensorRegistry } from '../SensorRegistry'

import { HTTP } from "../http-common";

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// @ts-ignore
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

import SensorHistoryPlot from "./SensorHistoryPlot.vue"
import TimeMode from "../model/time-mode";
import AnomalyView from "./AnomalyView.vue"
import LoadingSpinner from "./LoadingSpinner.vue";

import { MovingTimeSeriesPlot, DataPoint } from "../MovingTimeSeriesPlot";

// @ts-ignore
import { CanvasTimeSeriesPlot } from "../canvasplot.js";
import { Interval } from "luxon";
declare var d3version3: any;


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

    private internalSensor: Sensor = this.sensorRegistry.registeredSensors.find(s => s.identifier == "e-druckluft-e2")!

    private threshold: number = 3;

    private get interval(): Interval {
        return Interval.fromDateTimes(
            this.timeMode.getTime().minus({ days: 7 }),
            this.timeMode.getTime(),
        )
    }

    covertSensorToSelectable(sensor: Sensor) {
        if (sensor instanceof AggregatedSensor) {
        return {
            id: sensor.identifier,
            label: sensor.title,
            children: sensor.children,
        };
        } else {
        return {
            id: sensor.identifier,
            label: sensor.title,
        };
        }
    }

    private isLoading = false;
    private isError = false;

    //private plot!: CanvasTimeSeriesPlot; // Will definitely be assigned in mounted
    private plot!: MovingTimeSeriesPlot; // Will definitely be assigned in mounted

    get canvasplotContainer() {
        return this.$el.querySelector(".canvasplot-container")! as HTMLElement;
    }

    mounted() {
        this.plot = new MovingTimeSeriesPlot(this.canvasplotContainer, {
            plotStartsWithZero: true,
            yAxisLabel: "Active Power in kW",
        });
        this.fetchHistoryData();
    }

    @Watch("timeMode")
    ontimeModeChanged() {
        this.plot.destroy();
        this.plot = new MovingTimeSeriesPlot(this.canvasplotContainer, {
            plotStartsWithZero: true,
            yAxisLabel: "Active Power in kW",
        });
        this.fetchHistoryData();
    }

    private fetchHistoryData() {
        this.isLoading = true;
        let resource = this.internalSensor instanceof AggregatedSensor
            ? "aggregated-power-consumption"
            : "power-consumption";
        HTTP.get(resource + "/" + this.internalSensor.identifier + "?from=" + this.interval.start.toMillis() + "&to=" + this.interval.end.toMillis())
            .then((response) => {
                // JSON responses are automatically parsed.
                console.log(response.data)
                // TODO access sum generically
                let dataPoints: DataPoint[] = response.data.map(
                    (x: any) =>
                    new DataPoint(
                        new Date(x.timestamp),
                        this.internalSensor instanceof AggregatedSensor ? x.sumInW : x.valueInW
                    )
                );
                return dataPoints;
            })
            .then((points) => {
                this.plot.setDataPoints(points);
                this.isLoading = false;
            });;
    }

}
</script>

<style scoped>
.canvasplot-container {
  height: 300px;
}
</style>