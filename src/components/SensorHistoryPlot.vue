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
import { Sensor, AggregatedSensor } from '../SensorRegistry'
import LoadingSpinner from "./LoadingSpinner.vue"
import { TimeSeriesPlotManager, DataPoint } from '../TimeSeriesPlotManager';
import Repeater from "../Repeater";
import TimeMode from "../model/time-mode";
import { CanvasTimeSeriesPlot } from "../canvasPlot/CanvasTimeSeriesPlot";
const sumBy = require('lodash.sumby');
const debounce = require('lodash.debounce');

declare const d3version3: any; //eslint-disable-line @typescript-eslint/no-explicit-any

@Component({
    components: {
        LoadingSpinner
    }
})
export default class SensorHistoryPlot extends Vue {
    @Prop({ required: true }) sensor!: Sensor

    @Prop({  required: true }) timeMode!: TimeMode


    private isLoading = false
    private isError = false

    private plot!: CanvasTimeSeriesPlot // Will definitely be assigned in mounted
    private plotManager!: TimeSeriesPlotManager;


    get canvasplotContainer() {
        return this.$el.querySelector(".canvasplot-container")! as HTMLElement
    }

    created() {
    }

    mounted() {
        this.createPlot()
    }

    @Watch('sensor')
    onSensorChanged(sensor: Sensor) {
        this.createPlot()
    }

    @Watch('timeMode')
    onTimeModeChanged() {
        this.createPlot();
    }

    private createPlot() {
        this.plot && this.plot.destroy();

        const dimensions = [this.canvasplotContainer.clientWidth, this.canvasplotContainer.clientHeight];
        this.plot = new CanvasTimeSeriesPlot(
            d3version3.select(this.canvasplotContainer), 
            dimensions,
            {
                plotStartsWithZero: true,
                yAxisLabel: "Active Power in Watt",
                numberOfResolutionLevels: 3,
                disableLegend: true,
            }
        );
        this.plot.setZoomYAxis(false);
        this.isLoading = true;
        this.plotManager = new TimeSeriesPlotManager({
           plot: this.plot,
           sensorIdentifier: this.sensor.identifier,
           isAggregatedSensor: this.sensor instanceof AggregatedSensor,
           timeMode: this.timeMode,
           onFinishedLoading: () => this.isLoading = false
       });
    }

}
</script>

<style scoped>
    .canvasplot-container {
        height: 400px;
    }
</style>