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

import { ChartAPI, generate } from 'c3'
import 'c3/c3.css'
import { HTTP } from '../http-common'
import { Sensor, AggregatedSensor } from '../SensorRegistry'
import TimeMode from '../model/time-mode'

import LoadingSpinner from './LoadingSpinner.vue'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class Histogram extends Vue {
  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ default: 8 }) buckets!: number;

  @Prop({ required: true }) timeMode!: TimeMode;

  private chart!: ChartAPI;

  private isLoading = true;
  private isError = false;

  mounted () {
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
  onSensorChanged () {
    this.createPlot()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.createPlot()
  }

  private createPlot () {
    const resource =
      this.sensor instanceof AggregatedSensor
        ? 'active-power/aggregated'
        : 'active-power/raw'
    // Distribution of last hour
    const after = this.timeMode.getTime().minus({ hours: 1 })
    const to = this.timeMode.getTime()
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
        const labels: string[] = ['x']
        const values: Array<string | number> = [this.sensor.identifier]
        for (const bucket of response.data) {
          labels.push(
            '' + bucket.lower.toFixed(1) + ' - ' + bucket.upper.toFixed(1)
          )
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
