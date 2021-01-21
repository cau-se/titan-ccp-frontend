<template>
  <div class="card">
    <div class="card-body">
      <b-row>
        <b-col cols="9">
          <h5 class="card-title">Daily Composition</h5>
        </b-col>
        <b-col cols="3">
          <b-form-select
            v-if="selectedInterval"
            v-model="selectedInterval"
            :options="intervalSelectOptions"
          ></b-form-select>
        </b-col>
      </b-row>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="correlation-heatmap"></div>
        <div v-if="ids.length > 0" class="mt-2">
          <strong> Legend</strong>
          <ul class="list-inline mt-2">
            <li v-for="i in ids.length" :key="i" class="list-inline-item">
              <strong> &bull; {{ shortIds[i - 1] }}</strong>&nbsp;: {{ids[i - 1]}}
            </li>
          </ul>
      </div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { DateTime, Interval } from 'luxon'
import { HTTP } from '@/model/http-common'
import { AggregatedSensor } from '@/model/SensorRegistry'
import { select as d3select, Selection } from 'd3-selection'

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
export default class CorrelationHeatMap extends Vue {
    @Prop({ required: true }) sensor!: AggregatedSensor;

    @Prop({ required: true }) timeMode!: TimeMode;

    private availableIntervals: Interval[] = [];
    private selectedInterval: Interval | null = null;
    private isLoading = true;
    private isError = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private heatMap!: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private container!: Selection<any, unknown, null, undefined>;
    private readonly onSizeChanged = debounce(this.redrawChart, 600)
    private ids: Array<string> = []
    private shortIds: Array<string> = []

    get intervalSelectOptions (): Array<IntervalSelectOption> {
      return this.availableIntervals.map(i => new IntervalSelectOption(i))
    }

    private dateTimeToBackendISO (dateTime: DateTime): string {
      return dateTime.toUTC().toISO({ suppressMilliseconds: true })
    }

    mounted () {
      this.container = d3select(this.$el).select('.correlation-heatmap')
      this.getIdentifiers()
        .then(() => {
          this.loadAvailableIntervals()
            .then(() => this.drawHeatmap())
        })
      window.addEventListener('resize', this.onSizeChanged)
    }

    destroyed () {
      window.removeEventListener('resize', this.onSizeChanged)
    }

    private redrawChart () {
      this.drawHeatmap()
    }

    private loadAvailableIntervals () {
      return HTTP.get('/stats/interval/hour-of-day').then(
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

    private getIdentifiers () {
      return Promise.all(
        this.sensor.children.map(child => {
          this.ids.push(child.identifier)
          // create short version of this as label
          let to = 2
          let sid: string = child.identifier.substring(0, to)
          while (this.shortIds.indexOf(sid) > -1 && to < child.identifier.length) {
            to++
            sid = child.identifier.charAt(0) + child.identifier.charAt(to)
          }
          this.shortIds.push(sid)
        })
      )
    }

    private createHeatmapChart () {
      this.container.selectAll('*').remove()
      const containerWidth = this.container.node() ? this.container.node()?.getBoundingClientRect().width : false
      const boxSize = containerWidth / 25
      const containerHeight = (this.ids.length + 1) * boxSize
      // eslint-disable-next-line new-cap
      this.heatMap = new heatmap()
        .yAxisLabels(this.shortIds)
        .width(containerWidth)
        .height(containerHeight)
        .boxSize(boxSize)
        .colorSchema(colors.colorSchemas.red)
    }

    private async drawHeatmap (interval?: Interval) {
      this.createHeatmapChart()
      const defaultInterval = this.availableIntervals.find(interval => interval.end >= this.timeMode.getTime()) ||
        this.availableIntervals[this.availableIntervals.length - 1]
      const interval2 = interval || defaultInterval
      Promise.all(this.ids.map((id: string) => {
        const resource = `stats/sensor/${id}/hour-of-day?intervalStart=${this.dateTimeToBackendISO(interval2.start)}&intervalEnd=${this.dateTimeToBackendISO(interval2.end)}`
        return HTTP.get(resource)
          .then(response => {
            const heatMapData: Array <{ 'day': number; 'hour': number; 'value': number }> = []
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response.data.forEach((element: any) => {
              heatMapData.push({
                day: this.ids.indexOf(id),
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
      })).catch(e => {
        console.error(e)
        this.isError = true
        return []
      })
        .then(data => {
          const chartData = data.flat(1)
          this.isLoading = false
          this.container.datum(chartData).call(this.heatMap)
        })
    }
}

</script>
<style scoped>
</style>
