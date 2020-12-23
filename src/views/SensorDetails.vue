<template>
  <b-container>
    <b-row class="mb-4">
      <b-col :cols="isAggregated ? 10 : 12">
        <sensor-parents :sensor="internalSensor" v-on:select="setSensor"/>
      </b-col>
      <b-col v-if="isAggregated" cols ="2">
        <b-dropdown right text="Subconsumers" variant="secondary" size="lg" block class="children-dropdown">
          <b-dropdown-item v-for="child in internalSensor.children" :key="child.identifier" :to="buildPath(child)">
            {{ child.title }}
          </b-dropdown-item>
        </b-dropdown>
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col>
        <trend-arrow :sensor="internalSensor" :timespan="trendLastHour" :timeMode="timeMode" />
      </b-col>
      <b-col>
        <trend-arrow :sensor="internalSensor" :timespan="trendLastDay" :timeMode="timeMode" />
      </b-col>
      <b-col>
        <trend-arrow :sensor="internalSensor" :timespan="trendLastWeek" :timeMode="timeMode" />
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col>
        <sensor-history-plot :sensor="internalSensor" :timeMode="timeMode" :key="internalSensor.identifier" />
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col cols="6">
        <histogram :sensor="internalSensor" :timeMode="timeMode" :key="internalSensor.identifier" />
      </b-col>
      <b-col v-if="isAggregated" cols="6">
        <composition-pie-chart :sensor="internalSensor" :timeMode="timeMode" />
      </b-col>
      <b-col v-else cols="6">
        <contribution-pie-chart :sensor="internalSensor" :timeMode="timeMode" />
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col cols="6">
        <stats-plot :sensor="internalSensor" :stats-type="statsDayOfWeek" :timeMode="timeMode" />
      </b-col>
      <b-col cols="6">
        <stats-plot :sensor="internalSensor" :stats-type="statsHourOfDay" :timeMode="timeMode" />
      </b-col>
    </b-row>
      <b-row class="mb-4">
      <b-col cols="12">
        <heat-map :sensor="internalSensor" :timeMode="timeMode" />
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

import { Sensor, AggregatedSensor, SensorRegistry } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

import CompositionPieChart from '@/components/CompositionPieChart.vue'
import ContributionPieChart from '@/components/ContributionPieChart.vue'
import Histogram from '@/components/Histogram.vue'
import SensorHistoryPlot from '@/components/SensorHistoryPlot.vue'
import SensorParents from '@/components/SensorParents.vue'
import StatsPlot, { HOUR_OF_DAY, DAY_OF_WEEK } from '@/components/StatsPlot.vue'
import TrendArrow, { Timespan } from '@/components/TrendArrow.vue'
import HeatMap from '@/components/HeatMap.vue'

@Component({
  components: {
    SensorParents,
    SensorHistoryPlot,
    CompositionPieChart,
    ContributionPieChart,
    Histogram,
    StatsPlot,
    TrendArrow,
    HeatMap
  }
})
export default class SensorDetails extends Vue {
  @Prop({ required: true })
  sensorRegistry!: SensorRegistry;

  @Prop({ required: true }) timeMode!: TimeMode

  readonly trendLastHour = Timespan.LastHour
  readonly trendLastDay = Timespan.LastDay
  readonly trendLastWeek = Timespan.LastWeek

  readonly statsDayOfWeek = DAY_OF_WEEK
  readonly statsHourOfDay = HOUR_OF_DAY

  created () {
    if (this.$route.params.sensor_path === undefined) {
      this.$router.replace({
        path: `/sensor-details/${this.sensorRegistry.topLevelSensor.identifier}`
        // name: 'SensorDetails',
        // params: { this.sensorRegistry.topLevelSensor.identifier }
      })
    }
  }

  get internalSensor () {
    const identifierPath = this.$route.params.sensor_path.split('/')
    const sensor = this.findSensorInHierachy(identifierPath)
    // If sensor not found we show top-level sensor
    return sensor || this.sensorRegistry.topLevelSensor
  }

  get isAggregated () {
    return this.internalSensor instanceof AggregatedSensor
  }

  findSensorInHierachy (identifierPath: string[]): Sensor | undefined {
    let sensor: Sensor = this.sensorRegistry.topLevelSensor
    if (identifierPath.length < 1 || sensor.identifier !== identifierPath[0]) {
      // Empty identifierPath or not matching top-level sensor
      return undefined
    }
    for (const identifier of identifierPath.slice(1)) {
      console.log('id ' + identifier)
      if (!(sensor instanceof AggregatedSensor)) {
        // identifierPath has at least one more item but sensor has no children
        return undefined
      }
      const childSensor = sensor.children.find(child => child.identifier === identifier)
      if (childSensor === undefined) {
        // Do not find identifierPath's entry in children
        return undefined
      }
      sensor = childSensor
    }
    return sensor
  }

  buildPath (sensor: Sensor): string {
    return '/sensor-details/' + [...sensor.allParents, sensor].map(s => s.identifier).join('/')
  }
}
</script>

<style scoped>
  .children-dropdown {
    width: 100%;
  }
</style>
<style>
  /* Hack */
  .children-dropdown button {
    display: block;
    width: 100%;
    padding: 0.68rem 1rem;
    font-size: 1rem;
  }
</style>
