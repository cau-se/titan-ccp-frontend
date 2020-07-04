<template>
    <div class="card canvasplot-container">
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
// @ts-ignore
import { CanvasTimeSeriesPlot } from '../../canvasPlot/CanvasTimeSeriesPlot';
declare var d3: any;

@Component
export default class CanvasTimeSeriesPlotExample extends Vue {
    
    mounted() {
        let container = d3.select(this.$el);
        let width = this.$el.clientWidth;
        let height = this.$el.clientHeight;

        let ts1 = [];
        let ts2 = [];
        let now = new Date();
        for(var i=0; i<3*48; ++i) {
            let time = new Date(now.getTime());
            time.setHours(i);
            ts1.push([time, Math.sin(Math.PI * i/48) + 0.2*(Math.random()-0.5)]);
            ts2.push([time, Math.cos(Math.PI * i/48) + 0.2*(Math.random()-0.5)]);
        }
        var tsPlot = new CanvasTimeSeriesPlot(container, [width, height], {
            yAxisLabel: "Voltage [V]"
        });
        tsPlot.addDataSet("ds1", "Signal 1", ts1, "orange", false);
        tsPlot.addDataSet("ds2", "Signal 2", ts2, "steelblue", true);
        tsPlot.setZoomYAxis(false);
    }
}
</script>

<style scoped>
    .canvasplot-container {
        height: 500px;
    }
</style>