<template>
  <div>
    <loading-spinner :is-loading="isLoading" :is-error="isError">
      <b-table striped :items="filteredAnomalies" bordered></b-table>
    </loading-spinner>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import LoadingSpinner from './LoadingSpinner.vue'
import { HTTP } from '@/model/http-common'
import { Sensor } from '@/model/SensorRegistry'
import 'c3/c3.css'
import { DateTime, Interval } from 'luxon'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class AnomalyView extends Vue {
  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ required: true }) interval!: Interval;

  @Prop({ required: true }) threshold!: number;

  private isLoading = true;
  private isError = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private anomalies: any[] = [];

  get filteredAnomalies () {
    return this.anomalies.filter(anomaly => Math.abs(anomaly['Anomaly Score']) > this.threshold)
  }

  mounted () {
    this.loadData()
  }

  @Watch('sensor')
  onSensorChanged () {
    this.anomalies = []
    this.loadData()
  }

  @Watch('interval')
  onIntervalChanged () {
    this.anomalies = []
    this.loadData()
  }

  private loadData () {
    this.isLoading = true

    const url = `anomalies/${this.sensor.identifier}?from=${this.interval.start.toMillis()}&to=${this.interval.end.toMillis()}`

    HTTP.get(url)
      .then((response: { data: { timestamp: number; valueInW: number; anomalyScore: number }[] }) => {
        // JSON responses are automatically parsed.
        this.anomalies = response.data
          .map((entry: { timestamp: number; valueInW: number; anomalyScore: number }) => {
            return {
              Time: DateTime.fromMillis(entry.timestamp).setLocale('en-US').toLocaleString(DateTime.DATETIME_FULL),
              'Value in kW': (entry.valueInW / 1000).toFixed(1),
              'Anomaly Score': entry.anomalyScore.toFixed(2)
            }
          })
        this.isLoading = false
      })
      .catch((e) => {
        console.error(e)
        this.isError = true
      })
  }
}

</script>

<style scoped>

</style>
