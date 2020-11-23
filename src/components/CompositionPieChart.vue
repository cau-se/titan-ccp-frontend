<template>
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Composition</h5>
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
import { HTTP } from '@/model/http-common'
import { AggregatedSensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from './LoadingSpinner.vue'

@Component({
  components: {
    LoadingSpinner
  }
})
export default class CompositionPieChart extends Vue {
  @Prop({ required: true }) sensor!: AggregatedSensor

  @Prop({ required: true }) timeMode!: TimeMode;

  private isLoading = false
  private isError = false

  private chart!: ChartAPI

  mounted () {
    this.chart = generate({
      bindto: this.$el.querySelector('.c3-container') as HTMLElement,
      data: {
        columns: [],
        type: 'pie'
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

    Promise.all(this.sensor.children.map(child => {
      const resource = child instanceof AggregatedSensor ? 'active-power/aggregated' : 'active-power/raw'
      return HTTP.get(resource + '/' + child.identifier + '/latest?to=' + to.toMillis())
        .then(response => {
          // JSON responses are automatically parsed.
          let value
          if (response.data.length <= 0) {
            value = 0
          } else if (child instanceof AggregatedSensor) {
            value = response.data[0].sumInW
          } else {
            value = response.data[0].valueInW
          }
          return [child.title, value] as [string, number]
          // return <[string, number]> [child.title, value]
        })
    })).catch(e => {
      console.error(e)
      this.isError = true
      return []
    }).then(columns => {
      this.isLoading = false
      this.chart.load({
        columns: columns,
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
