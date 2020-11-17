<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Histogram</h5>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="c3-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import LoadingSpinner from './LoadingSpinner.vue'
import { HTTP } from '../http-common'
import { Sensor, AggregatedSensor } from '../SensorRegistry'
import { ChartAPI, generate } from 'c3'
import 'c3/c3.css'
import TimeMode from '../model/time-mode'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class DistributionPlot extends Vue {
  // TODO Rename to histogram

  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ default: 8 }) buckets!: number;

  @Prop({ required: true }) timeMode!: TimeMode;

  private chart!: ChartAPI;

  private isLoading = true;
  private isError = false;

  mounted() {
    this.chart = generate({
      bindto: this.$el.querySelector('.c3-container') as HTMLElement,
      data: {
        x: 'x',
        columns: [],
        type: 'bar'
      },
      legend: {
        show: false
      },
      axis: {
        x: {
          type: 'category' // this needed to load string x value
        }
      },
      tooltip: {
        show: false
      }
    })
    this.createPlot()
  }

  @Watch('sensor')
  onSensorChanged(sensor: Sensor) {
    this.createPlot()
  }

  @Watch('timeMode')
  onTimeModeChanged() {
    this.createPlot()
  }

  private createPlot() {
    let resource =
      this.sensor instanceof AggregatedSensor
        ? 'active-power/aggregated'
        : 'active-power/raw'
    // Distribution of last hour
    let after = this.timeMode.getTime().minus({ hours: 1 });
    let to = this.timeMode.getTime()
    HTTP.get(
      resource +
        '/' +
        this.sensor.identifier +
        '/distribution?after=' +
        after.toMillis() +
        '&to=' +
        to.toMillis() +
        '&buckets=' +
        this.buckets
    )
      .then(response => {
        // JSON responses are automatically parsed.
        let labels: string[] = ['x']
        let values: Array<string | number> = [this.sensor.identifier]
        for (let bucket of response.data) {
          labels.push(
            '' + bucket.lower.toFixed(1) + ' - ' + bucket.upper.toFixed(1)
          );
          values.push(bucket.elements)
        }
        return [labels, values]
      })
      .catch(e => {
        console.error(e)
        this.isError = true
        return [['x'], [this.sensor.identifier]]
      })
      .then(data => {
        this.chart.unload()
        this.chart.load({
          columns: data,
          unload: true
        })
        this.isLoading = false
      })
  }
}
</script>

<style scoped>
.c3-container {
  height: 300px;
}
</style>
