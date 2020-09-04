<template>
    <b-container class="">
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
                <distribution-plot :timeMode="timeMode" :sensor="sensor" />
            </b-col>
            <b-col cols="6">
                <composition-pie-chart :sensor="sensor" />
            </b-col>
        </b-row>
        <b-row class="mb-4">
            <b-col cols="12">
                <stats-plot :timeMode="timeMode" :sensor="sensor" :stats-type="statsDayOfWeek" />
            </b-col>
        </b-row>
        <b-row class="mb-4">
            <b-col cols="12">
                <stats-plot :timeMode="timeMode" :sensor="sensor" :stats-type="statsHourOfDay" />
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator"
import { Sensor, AggregatedSensor, MachineSensor, SensorRegistry } from '../SensorRegistry'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { SensorRegistryRequester } from '../SensorRegistry'

import SensorDetails from "./SensorDetails.vue"

import DistributionPlot from "./DistributionPlot.vue"
import CompositionPieChart from "./CompositionPieChart.vue"
import StatsPlot from "./StatsPlot.vue"
import { HOUR_OF_DAY } from "./StatsPlot.vue"
import { DAY_OF_WEEK } from "./StatsPlot.vue"
import SensorHistoryPlot from "./SensorHistoryPlot.vue"
import TrendArrow from "./TrendArrow.vue"
import { Timespan } from "./TrendArrow.vue"

import Examples from "./Examples.vue"
import { DateTime } from "luxon";
import TimeMode from "../model/time-mode";

@Component({
    components: {
        SensorHistoryPlot,
        CompositionPieChart,
        DistributionPlot,
        StatsPlot,
        TrendArrow
    }
})
export default class App extends Vue {

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