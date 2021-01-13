<template>
  <div class="card">
    <div class="card-body">
      <b-row>
        <b-col cols="4">
          <h5 class="card-title">Weekly Course {{ sensor.title }}</h5>
        </b-col>
        <b-col cols="3">
          <b-form-select
            v-if="selectedInterval"
            v-model="selectedInterval"
            :options="intervalSelectOptions"
            class="mb-3"
          ></b-form-select>
        </b-col>
      </b-row>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="heatmap" id='heatmap'></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { DateTime, Interval } from 'luxon'
import { HTTP } from '@/model/http-common'
import { Sensor } from '@/model/SensorRegistry'
import { select as d3select, selectAll as d3selectAll } from 'd3-selection'

import LoadingSpinner from './LoadingSpinner.vue'

import heatmap from 'britecharts/dist/umd/heatmap.min'
import colors from 'britecharts/dist/umd/colors.min'
import TimeMode from '@/model/time-mode'
import debounce from 'lodash.debounce'

class IntervalSelectOption {
    public readonly value: Interval;
    public readonly text: string;

    constructor (interval: Interval) {
      this.value = interval
      this.text = interval.toFormat('yyyy/MM/dd')
    }
}

@Component({
  components: {
    LoadingSpinner
  }
})
export default class Heatmap extends Vue {
    @Prop({ required: true }) sensor!: Sensor;

    @Prop({ required: true }) timeMode!: TimeMode;

    private availableIntervals: Interval[] = [];
    private selectedInterval: Interval | null = null;
    private isLoading = true;
    private isError = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private heatMap!: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private container!: d3.Selection<any, any, HTMLElement, undefined>;
    private readonly onSizeChanged = debounce(this.redrawChart, 600)

    get intervalSelectOptions (): Array<IntervalSelectOption> {
      return this.availableIntervals.map(i => new IntervalSelectOption(i))
    }

    private dateTimeToBackendISO (dateTime: DateTime): string {
      return dateTime.toUTC().toISO({ suppressMilliseconds: true })
    }

    mounted () {
      this.container = d3select('.heatmap')
      this.loadAvailableIntervals().then(() => this.drawHeatmap())
      window.addEventListener('resize', this.onSizeChanged)
    }

    destroyed () {
      window.removeEventListener('resize', this.onSizeChanged)
    }

    private redrawChart () {
      this.drawHeatmap()
    }

    private loadAvailableIntervals () {
      return HTTP.get('/stats/interval/hour-of-week').then(
        (response) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.availableIntervals = response.data.map((i: any) =>
            Interval.fromDateTimes(
              DateTime.fromISO(i.intervalStart),
              DateTime.fromISO(i.intervalEnd)
            )
          )
        }
      )
    }

    @Watch('selectedInterval')
    onIntervalChanged (interval: Interval, oldInterval: Interval) {
      if (oldInterval != null) {
        this.drawHeatmap(interval)
      }
    }

    @Watch('sensor')
    onSensorChanged () {
      this.drawHeatmap()
    }

    private createHeatmapChart () {
      this.container.html('')
      d3selectAll('#heatmap > *').remove()
      const containerWidth = this.container.node() ? this.container.node()?.getBoundingClientRect().width : false
      const boxSize = (containerWidth - 20) / 25
      const containerHeight = 8 * boxSize

      // eslint-disable-next-line new-cap
      this.heatMap = new heatmap()
      this.heatMap
        .width(containerWidth)
        .height(containerHeight)
        .boxSize(boxSize)
        .colorSchema(colors.colorSchemas.green)
    }

    private drawHeatmap (interval?: Interval) {
      this.createHeatmapChart()
      const heatMapData: Array <{ 'day': number; 'hour': number; 'value': number }> = []
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const defaultInterval = this.availableIntervals.find(interval => interval.end >= this.timeMode.getTime())! ||
        this.availableIntervals[this.availableIntervals.length - 1]
      const interval2 = interval || defaultInterval
      const url = `stats/sensor/${this.sensor.identifier}/${'hour-of-week'
        }?intervalStart=${this.dateTimeToBackendISO(interval2.start)
        }&intervalEnd=${this.dateTimeToBackendISO(interval2.end)}`

      HTTP.get(url)
        .then(response => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.data.forEach((element: any) => {
            heatMapData.push({
              day: element.dayOfWeek - 1,
              hour: element.hourOfDay,
              value: element.mean
            })
          })
          // Update selected interval
          if (response.data.length > 0 && this.selectedInterval == null) {
            this.selectedInterval = Interval.fromDateTimes(
              DateTime.fromMillis(response.data[0].periodStart),
              DateTime.fromMillis(response.data[0].periodEnd)
            )
          }
          return heatMapData
        })
        .catch(e => {
          console.error(e)
          this.isError = true
          return [['x'], ['mean']]
        })
        .then(data => {
          this.container.datum(data).call(this.heatMap)
          this.isLoading = false
        })
    }
}
</script>
<style scoped>
  .heatmap {
    height: auto;
    min-height: 250px;
  }
</style>
