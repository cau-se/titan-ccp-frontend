<template>
  <b-container>
    <b-row class="mb-4">
      <b-col>
        <trend-arrow :timeMode="timeMode" :sensor="sensor" :timespan="trendLastHour" />
      </b-col>
      <b-col>
        <trend-arrow :timeMode="timeMode" :sensor="sensor" :timespan="trendLastDay" />
      </b-col>
      <b-col>
        <trend-arrow :timeMode="timeMode" :sensor="sensor" :timespan="trendLastWeek" />
      </b-col>
    </b-row>
    <b-row class="mb-4">
        <b-col>
          <sensor-history-plot :timeMode="timeMode" :sensor="sensor" />
        </b-col>
    </b-row>
    <b-row class="mb-4">
        <b-col cols="6">
          <histogram :timeMode="timeMode" :sensor="sensor" />
        </b-col>
        <b-col cols="6">
          <composition-donut-chart :sensor="sensor" :timeMode="timeMode" />
        </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col cols="12">
        <stats-plot :sensor="sensor" :stats-type="statsDayOfWeek" :timeMode="timeMode" />
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col cols="12">
        <stats-plot :sensor="sensor" :stats-type="statsHourOfDay" :timeMode="timeMode" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

import { Sensor } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import CompositionDonutChart from '@/components/CompositionDonutChart.vue'
import Histogram from '@/components/Histogram.vue'
import SensorHistoryPlot from '@/components/SensorHistoryPlot.vue'
import StatsPlot, { HOUR_OF_DAY, DAY_OF_WEEK } from '@/components/StatsPlot.vue'
import TrendArrow, { Timespan } from '@/components/TrendArrow.vue'

@Component({
  components: {
    SensorHistoryPlot,
    CompositionDonutChart,
    Histogram,
    StatsPlot,
    TrendArrow
  }
})
export default class Dashboard extends Vue {
  @Prop({ required: true }) sensor!: Sensor

  @Prop() timeMode!: TimeMode

  readonly trendLastHour = Timespan.LastHour
  readonly trendLastDay = Timespan.LastDay
  readonly trendLastWeek = Timespan.LastWeek

  readonly statsDayOfWeek = DAY_OF_WEEK
  readonly statsHourOfDay = HOUR_OF_DAY
}
</script>

<style scoped>
</style>
