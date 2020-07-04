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
// @ts-ignore
import { CanvasTimeSeriesPlot } from '../canvasplot.js';
import { MovingTimeSeriesPlot, DataPoint } from '../MovingTimeSeriesPlot';
import Repeater from "../Repeater";
import { DateTime } from "luxon";
import TimeMode from "../model/time-mode";
const sumBy = require('lodash.sumby');
const debounce = require('lodash.debounce');

@Component({
    components: {
        LoadingSpinner
    }
})
export default class SensorHistoryPlot extends Vue {
     
    private refreshIntervalInMs = 1000

    @Prop({ required: true }) sensor!: Sensor

    @Prop({  required: true }) timeMode!: TimeMode

    private timeOffset: number = 0

    private dataPoints: any[] = []

    private latest = this.completeHistory ? 0 : this.timeMode.getTime().toMillis() - (3600*10000);

    private windowSize = 900000;

    private isLoading = false
    private isError = false

    private plot!: MovingTimeSeriesPlot // Will definitely be assigned in mounted

    private requester = new Repeater(this.createPlot, this.updatePlot, this.refreshIntervalInMs)

    get canvasplotContainer() {
        return this.$el.querySelector(".canvasplot-container")! as HTMLElement
    }

    get completeHistory() {
        console.log("SHOW_COMPLETE_HISTORY " + process.env.SHOW_COMPLETE_HISTORY);
        return process.env.SHOW_COMPLETE_HISTORY === "true"
    }

    created() {
    }

    mounted() {
        this.requester.start()
    }

    destroyed() {
        this.requester.stop()
    }

    @Watch('sensor')
    onSensorChanged(sensor: Sensor) {
        this.destroyPlot()
        this.requester.restart()
    }

    @Watch('timeMode')
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
            yAxisLabel: "Active Power in Watt",
            onZoom: debounce(this.handleZoom, 300)
        })
        // BETTER fetch already earlier and then wait for mount
        this.isLoading = true
        return this.fetchNewData(this.latest, undefined, this.windowSize)
            .catch(e => {
                console.error(e);
                this.isError = true
                return []
            })
            .then((dataPoints) => {
                if (!this.timeMode.autoLoading) {
                    new Promise<DataPoint[]>((resolve, reject) => {
                        let acc: DataPoint[] = []
                        for (let point of dataPoints) {
                            if (point.date.getTime() < this.timeMode.getTime().toMillis()) {
                                acc.push(point)
                            } else break;
                        }
                        return resolve(acc);
                    }).then(points => {
                        this.plot.setDataPoints(points, true);
                        this.isLoading = false
                    })
                } else {
                    this.plot.setDataPoints(dataPoints, true)
                    this.isLoading = false
                }
            })
        
    }

    private updatePlot() {
        if (this.timeMode.autoLoading) {      
            this.fetchNewData(this.latest, undefined, this.windowSize).then(dataPoints => this.plot.addDataPoints(dataPoints));
        }
    }

    private destroyPlot() {
        this.latest = this.completeHistory ? 0 : this.timeMode.getTime().toMillis() - (3600*1000)
        this.plot.destroy()
    }

    private fetchNewData(after: number, to: number | undefined, windowSize: number): Promise<DataPoint[]> {
        let resource = this.sensor instanceof AggregatedSensor ? 'aggregated-power-consumption' : 'power-consumption' 
        const url = `${resource}/${this.sensor.identifier}?after=${after}`
        return HTTP.get(url)
            .then(response => {
                // JSON responses are automatically parsed.
                if (response.data.length > 0) {
                    this.latest = response.data[response.data.length - 1].timestamp
                }
                // TODO access sum generically
                return response.data.map((x: any) => new DataPoint(new Date(x.timestamp), this.sensor instanceof AggregatedSensor ? x.sumInW : x.valueInW));
            }).then((data) => this.aggregate(data, windowSize));
    }

    private aggregate(data: DataPoint[], windowSize: number):DataPoint[] {
        if (data.length < 1) return data;
        const firstTimestamp = data[0].toArray()[0];
        let windows: DataPoint[][] = [[]];

        // sort data into windows
        data.forEach((dataPoint, index) => {
            const timestamp = dataPoint.toArray()[0];
            const timeSinceFirst = timestamp - firstTimestamp;
            const windowNumber = Math.floor(timeSinceFirst / windowSize); 
            if (windows[windowNumber]) {
                windows[windowNumber].push(dataPoint);
            } else {
                windows[windowNumber] = [dataPoint]
            }
            
        });

        // aggregate within windows
        const aggregated: DataPoint[] = []
        windows.forEach(data => {
            if (data.length < 1) return;
            const sum = sumBy(data, (d: DataPoint) => d.toArray()[1]);
            const avg = Math.round(sum / data.length);
            const lastTimestampInWindow = data[data.length - 1].toArray()[0];
            const dp = new DataPoint(lastTimestampInWindow, avg);
            aggregated.push(dp)
        })

        return aggregated;
    } 

    private handleZoom(xDomain: any, _: undefined, zoomFactor: number) {
        // zoom in
        const from = xDomain[0].getTime();
        const to = xDomain[1].getTime();
        this.windowSize /= 2;
        this.fetchNewData(from, to, this.windowSize).then((v) => this.plot.setDataPoints(v, false))
    }
}
</script>

<style scoped>
    .canvasplot-container {
        height: 400px;
    }
</style>