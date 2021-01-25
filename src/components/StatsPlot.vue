<template>
  <div class="card">
    <div class="card-body">
      <b-row>
        <b-col cols="6">
          <h5 class="card-title">{{ statsType.title }}</h5>
        </b-col>
        <b-col cols="6" class="d-flex justify-content-end">
          <b-form-select
            v-if="selectedInterval"
            v-model="selectedInterval"
            :options="intervalSelectOptions"
            size="sm"
            class="w-auto"
          ></b-form-select>
        </b-col>
      </b-row>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div :class="statsType.url" class="plot-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import { DateTime, Interval } from 'luxon'
import { HTTP } from '@/model/http-common'
import { Sensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import LoadingSpinner from './LoadingSpinner.vue'

import { select as d3select, Selection } from 'd3-selection'
import 'britecharts/dist/css/britecharts.css'
import line from 'britecharts/dist/umd/line.min'
import tooltip from 'britecharts/dist/umd/tooltip.min'
import debounce from 'lodash.debounce'

function getDayOfWeekText (number: number) {
  switch (number) {
    case 1: {
      return 'Monday'
    }
    case 2: {
      return 'Tuesday'
    }
    case 3: {
      return 'Wednesday'
    }
    case 4: {
      return 'Thursday'
    }
    case 5: {
      return 'Friday'
    }
    case 6: {
      return 'Saturday'
    }
    case 7: {
      return 'Sunday'
    }
    default: {
      throw new RangeError('Day of week number must be between 1 and 7')
    }
  }
}

function getDayOfWeekNumber (name: string) {
  switch (name) {
    case 'Sunday': {
      return 7
    }
    case 'Monday': {
      return 1
    }
    case 'Tuesday': {
      return 2
    }
    case 'Wednesday': {
      return 3
    }
    case 'Thursday': {
      return 4
    }
    case 'Friday': {
      return 5
    }
    case 'Saturday': {
      return 6
    }
    default: {
      throw new RangeError('Day of week number must be between 1 and 7')
    }
  }
}

class IntervalSelectOption {
  public readonly value: Interval;
  public readonly text: string;

  constructor (interval: Interval) {
    this.value = interval
    this.text = interval.toFormat('yyyy/MM/dd')
  }
}

export interface StatsType {
  title: string;
  url: string;
  xAxisFormat: string;
  dateFormat: string;
  tooltipTitle: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor: (stats: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tickNameToDateTime: (tickName: any) => DateTime;
}

export const HOUR_OF_DAY: StatsType = {
  title: 'Daily Course',
  url: 'hour-of-day',
  xAxisFormat: '%H',
  dateFormat: '%H',
  tooltipTitle: 'Hour of day',
  accessor: (stats) => stats.hourOfDay,
  tickNameToDateTime: (tickName) => DateTime.local(2000, 1, 1, tickName, 0, 0, 0)
}

export const DAY_OF_WEEK: StatsType = {
  title: 'Weekly Course',
  url: 'day-of-week',
  xAxisFormat: '%A',
  dateFormat: '%A',
  tooltipTitle: 'Day of week',
  accessor: (stats) => getDayOfWeekText(stats.dayOfWeek),
  tickNameToDateTime: (tickName) => DateTime
    .local(2000, 1, 1, 0, 0, 0, 0)
    .set({ weekday: getDayOfWeekNumber(tickName) })

}
const lineMargin = { top: 20, bottom: 30, left: 50, right: 20 }

@Component({
  components: {
    LoadingSpinner
  }
})
export default class StatsPlot extends Vue {
  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ required: true }) statsType!: StatsType;

  @Prop({ required: true }) timeMode!: TimeMode;

  private availableIntervals: Interval[] = [];
  private selectedInterval: Interval | null = null;

  private isLoading = true;
  private isError = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private plot!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tooltip!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private container!: Selection<any, any, null, undefined>;
  private containerWidth!: number;
  private containerHeight!: number;
  private readonly onSizeChanged = debounce(this.redrawChart, 600)

  get intervalSelectOptions (): Array<IntervalSelectOption> {
    return this.availableIntervals.map((i) => new IntervalSelectOption(i))
  }

  mounted () {
    // eslint-disable-next-line new-cap
    this.plot = new line()
    this.container = d3select(this.$el.querySelector('.' + this.statsType.url))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.containerWidth = this.container.node()!.getBoundingClientRect().width
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.containerHeight = this.container.node()!.getBoundingClientRect().height
    // eslint-disable-next-line new-cap
    this.tooltip = new tooltip()

    this.tooltip
      .title(this.statsType.tooltipTitle)
      .numberFormat('.2f')
      .dateFormat(this.tooltip.axisTimeCombinations.CUSTOM)
      .dateCustomFormat(this.statsType.dateFormat)

    this.plot
      .width(this.containerWidth)
      .height(this.containerHeight)
      .tooltipThreshold(600)
      .lineCurve('basis')
      .grid('full')
      .xAxisFormat('custom')
      .xAxisCustomFormat(this.statsType.xAxisFormat)
      .isAnimated(true)
      .margin(lineMargin)
      .on('customMouseOver', this.tooltip.show)
      .on('customMouseMove', this.tooltip.update)
      .on('customMouseOut', this.tooltip.hide)

    this.loadAvailableIntervals().then(() => this.createPlot())
    window.addEventListener('resize', this.onSizeChanged)
  }

  destroyed () {
    window.removeEventListener('resize', this.onSizeChanged)
  }

  private redrawChart () {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const newContainerWidth = this.container.node() ? this.container.node()!.getBoundingClientRect().width : false
    this.plot.width(newContainerWidth)
    this.container.call(this.plot)
  }

  @Watch('sensor')
  onSensorChanged () {
    this.createPlot()
  }

  private loadAvailableIntervals () {
    return HTTP.get(`/stats/interval/${this.statsType.url}`).then(
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
      this.createPlot(interval)
    }
  }

  private createPlot (interval?: Interval) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const defaultInterval = this.availableIntervals.find(interval => interval.end >= this.timeMode.getTime())! || this.availableIntervals[this.availableIntervals.length - 1]
    const interval2 = interval || defaultInterval

    const url = `stats/sensor/${this.sensor.identifier}/${
      this.statsType.url
    }?intervalStart=${this.dateTimeToBackendISO(
      interval2.start
    )}&intervalEnd=${this.dateTimeToBackendISO(interval2.end)}`

    HTTP.get(url)
      .then((response) => {
        // JSON responses are automatically parsed.
        const labels: string[] = ['x']
        const minValues: Array<string | number> = ['min']
        const meanValues: Array<string | number> = ['mean']
        const maxValues: Array<string | number> = ['max']
        for (const stats of response.data) {
          labels.push(this.statsType.accessor(stats))
          minValues.push(stats.min)
          meanValues.push(stats.mean)
          maxValues.push(stats.max)
        }
        // Update selected interval
        if (response.data.length > 0 && this.selectedInterval == null) {
          this.selectedInterval = Interval.fromDateTimes(
            DateTime.fromMillis(response.data[0].periodStart),
            DateTime.fromMillis(response.data[0].periodEnd)
          )
        }
        // return [labels, minValues, meanValues, maxValues]
        return [labels, meanValues]
      })
      .catch((e) => {
        console.error(e)
        this.isError = true
        // return [['x'], ['min'], ['mean'], ['max']]
        return [['x'], ['mean']]
      })
      .then((data) => {
        this.plot.xTicks(data[0].length - 0)
        const datal = this.cleanFormat(data)
        this.container.datum(datal).call(this.plot)
        const tooltipContainer = d3select('.' + this.statsType.url + ' .metadata-group .vertical-marker-container')
        tooltipContainer.datum([]).call(this.tooltip)
        this.isLoading = false
      })
  }

  private dateTimeToBackendISO (dateTime: DateTime): string {
    return dateTime.toUTC().toISO({ suppressMilliseconds: true })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cleanFormat (rawData: any): any {
    rawData[1].shift()
    rawData[0].shift()

    const data = rawData[1]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xAxisTickName: any = rawData[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanFormat = { data: [] as any }
    const ticksName: Array<Date> = []

    // set tick names and allign time of data points in stats plot
    for (let i = 0; i < data.length; i++) {
      ticksName.push(
        this.statsType.tickNameToDateTime(
          xAxisTickName[i])
          .toJSDate())
    }

    for (let i = 0; i < data.length; i++) {
      cleanFormat.data.push({
        topicName: 'mean',
        name: 0,
        date: ticksName[i].toISOString(),
        value: data[i]
      })
    }
    return cleanFormat
  }
}

</script>

<style scoped>
.plot-container {
  height: 300px;
  overflow: hidden;
}
</style>
