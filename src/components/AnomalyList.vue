<template>
  <div>
    <loading-spinner :is-loading="isLoading" :is-error="isError">
      <b-table striped :fields="fields" :items="filteredAnomalies" bordered></b-table>
    </loading-spinner>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import LoadingSpinner from './LoadingSpinner.vue'

import { HTTP } from '@/model/http-common'
import { Sensor } from '@/model/SensorRegistry'

import axios, { CancelTokenSource } from 'axios'
import { DateTime, Interval } from 'luxon'

interface Anomaly {
  time: DateTime;
  valueInW: number;
  anomalyScore: number;
}

@Component({
  components: {
    LoadingSpinner
  }
})
export default class AnomalyList extends Vue {
  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ required: true }) interval!: Interval;

  @Prop({ required: true }) threshold!: number;

  private cancelTokenSource?: CancelTokenSource;

  private isLoading = false;
  private isError = false;

  private anomalies: Anomaly[] = [];

  get filteredAnomalies () {
    return this.anomalies.filter(anomaly => Math.abs(anomaly.anomalyScore) > this.threshold)
  }

  get fields () {
    return [
      {
        key: 'time',
        label: 'Time',
        formatter: (value: DateTime) => value.setLocale('en-US').toLocaleString(DateTime.DATETIME_FULL)
      },
      {
        key: 'valueInW',
        label: 'Value in kW',
        formatter: (value: number) => (value / 1000).toFixed(1)
      },
      {
        key: 'anomalyScore',
        label: 'Anomaly Score',
        formatter: (value: number) => value.toFixed(2)
      }
    ]
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
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Previous request canceled.')
    }

    this.cancelTokenSource = axios.CancelToken.source()
    this.isLoading = true
    this.isError = false

    HTTP.get(this.resourceUrl, { cancelToken: this.cancelTokenSource.token })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((response: any) => {
        // JSON responses are automatically parsed.
        this.anomalies = response.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((entry: any) => {
            return {
              time: DateTime.fromMillis(entry.timestamp),
              valueInW: entry.valueInW,
              anomalyScore: entry.anomalyScore
            }
          })
      })
      .catch((e) => {
        if (axios.isCancel(e)) {
          console.log('Request canceled.')
          console.log(e)
        } else {
          console.error(e)
          this.isError = true
        }
      })
      .then(() => {
        this.isLoading = false
        this.cancelTokenSource = undefined
      })
  }

  private get resourceUrl () {
    return `anomalies/${this.sensor.identifier}?from=${this.interval.start.toMillis()}&to=${this.interval.end.toMillis()}`
  }
}

</script>

<style scoped>

</style>
