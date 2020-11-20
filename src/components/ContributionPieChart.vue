<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Contribution</h5>
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
import { MachineSensor } from '../SensorRegistry'
import TimeMode from '../model/time-mode'

import LoadingSpinner from './LoadingSpinner.vue'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class ContributionPieChart extends Vue {
  @Prop({ required: true }) sensor!: MachineSensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false

  private chart!: ChartAPI

  mounted () {
    this.chart = generate({
      bindto: this.$el.querySelector('.c3-container') as HTMLElement,
      data: {
        columns: [],
        type: 'pie',
        order: null,
        colors: {
          Others: '#BBBBBB'
        }
      },
      tooltip: {
        show: false
      }
    })
    this.updateChart()
  }

  @Watch('sensor')
  onSensorChanged () {
    this.updateChart()
  }

  @Watch('timeMode')
  onTimeModeChanged () {
    this.updateChart()
  }

  private updateChart () {
    this.isLoading = true

    const to = this.timeMode.getTime()

    Promise.all([
      HTTP.get('active-power/raw/' + this.sensor.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          // JSON responses are automatically parsed.
          return response.data.length <= 0 ? 0 : response.data[0].valueInW
        }),
      HTTP.get('active-power/aggregated/' + this.sensor.parent!.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          // JSON responses are automatically parsed.
          return response.data.length <= 0 ? 0 : response.data[0].sumInW
        })
    ])
      .then(values => {
        this.isLoading = false
        this.chart.load({
          columns: [[this.sensor.title, values[0]], ['Others', values[1] - values[0]]],
          unload: true
        })
      })
  }
}
</script>

<style scoped>
  .c3-container {
    height: 300px;
  }
</style>
