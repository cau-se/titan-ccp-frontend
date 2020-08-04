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
import { MovingTimeSeriesPlot, DataPoint } from '../MovingTimeSeriesPlot';
import Repeater from "../Repeater";
import TimeMode from "../model/time-mode";
const sumBy = require('lodash.sumby');
const debounce = require('lodash.debounce');

@Component({
    components: {
        LoadingSpinner
    }
})
export default class SensorHistoryPlot extends Vue {
     
    private refreshIntervalInMs = 5000

    @Prop({ required: true }) sensor!: Sensor

    @Prop({  required: true }) timeMode!: TimeMode

    private latest = this.completeHistory ? 0 : this.timeMode.getTime().toMillis() - (3600*10000);

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
            onZoom: debounce(this.handleZoom, 300),
            numberOfResolutionLevels: 3
        })
        // BETTER fetch already earlier and then wait for mount
        this.isLoading = true
        return this.fetchNewData("minutely", this.latest)
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
            this.fetchNewData("raw", this.latest).then(dataPoints => this.plot.appendDataPoints(dataPoints));
        }
    }

    private destroyPlot() {
        this.latest = this.completeHistory ? 0 : this.timeMode.getTime().toMillis() - (3600*1000)
        this.plot.destroy()
    }

    /**
     * Fetches new data for the current sensor.
     * 
     * @param windowSize - Determines the temporal resolution of the returned data.
     * @param from - The earliest data to fetch.
     * @param to - The latest data to fetch.
     * 
     * @returns Promise resolving to an array of DataPoints.
     */
    private fetchNewData(windowSize: "raw" | "minutely" | "hourly", from: number, to?: number): Promise<DataPoint[]> {
        const toMillis = to? to : this.timeMode.getTime().toMillis();
        const fetchPromise = windowSize === "raw"
            ? this.fetchNewRawData(from, toMillis)
            : this.fetchNewWindowedData(windowSize, from, toMillis);

        // save latest received timestamp
        fetchPromise.then((dataPoints) => {
            if (dataPoints.length > 0 && windowSize === "raw" && !to) {
                this.latest = dataPoints[dataPoints.length - 1].date.getTime();
            }
            return dataPoints;
        });

        return fetchPromise;
    }

    /**
     * Fetches windowed data for the current sensor.
     * 
     * @param windowSize - Determines the temporal resolution of the returned data.
     * @param from - The earliest data to fetch.
     * @param to - The latest data to fetch.
     * 
     * @returns Promise resolving to an array of DataPoints.
     */
    private fetchNewWindowedData(windowSize: "hourly" | "minutely", from: number, to: number): Promise<DataPoint[]> {
        const resource = `active-power/windowed/${windowSize}/${this.sensor.identifier}`;
        const params = `?from=${from}&to=${to}`;
        const url = resource + params;
        return HTTP.get(url).then((response) => {
            // Map the response to an array of datapoints and return it
            return response.data.map((x: any) => {
                return new DataPoint(new Date(x.endTimestamp), x.mean);
            });
        });
    }

    /**
     * Fetches raw data for the current sensor, which means a maximum temporal resolution.
     * 
     * @param windowSize - Determines the temporal resolution of the returned data.
     * @param from - The earliest data to fetch.
     * @param to - The latest data to fetch.
     * 
     * @returns Promise resolving to an array of DataPoints.
     */
    private fetchNewRawData(from: number, to: number): Promise<DataPoint[]> {
        const resource = this.sensor instanceof AggregatedSensor 
            ? 'aggregated-power-consumption/' 
            : 'power-consumption/';
        const identifier = this.sensor.identifier;
        const params = `?from=${from}&to=${to}`;
        const url = resource + identifier + params;
        return HTTP.get(url).then((response) => {
            // Map response to an array of DataPoints and return it
            return response.data.map((x: any) => {
                const date = new Date(x.timestamp);
                const value = this.sensor instanceof AggregatedSensor ? x.sumInW : x.valueInW;
                return new DataPoint(date, value);
            });
        });
    }

    /**
     * Aggregates the given DataPoints in the temporal dimension.
     * 
     * @param data - The array of data points to aggregate.
     * @param windowSize - Length of aggregate intervall in miliseconds.
     */
    private aggregate(data: DataPoint[], windowSize: number): DataPoint[] {
        if (data.length < 1) return data;
        const firstTimestamp = data[0].toArray()[0].getTime();
        let windows: DataPoint[][] = [[]];

        // sort data into windows
        data.forEach((dataPoint, index) => {
            const timestamp = dataPoint.toArray()[0].getTime();
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

    /**
     * ZoomHandler for the plot. Handles, which data is to be fetched for the new zoom level.
     */
    private handleZoom(xDomain: any, _: undefined, zoomFactor: number) {
        // calculate the domain span in the plot
        const from = xDomain[0].getTime();
        const to = xDomain[1].getTime();
        const diff = to - from;

        // Define window size for the next data fetch
        let windowSize: "raw" | "minutely" | "hourly";
        let resolutionLevel: number; 
        if (diff <= 15 * 60 * 1000) { // less than 15 minutes
            windowSize = "raw";
            resolutionLevel = 0;
        } else if (diff <= 10 * 60 * 60 * 1000) { // less then 10 hours
            windowSize = "minutely";
            resolutionLevel = 1;
        } else {
            windowSize = "hourly";
            resolutionLevel = 2;
        }


        // Start fetching new data with the calculated options
        this.fetchNewData(windowSize, from, to).then((dataPoints) => {
            this.plot.injectDataPoints(dataPoints, resolutionLevel)
        });
    }
}
</script>

<style scoped>
    .canvasplot-container {
        height: 400px;
    }
</style>