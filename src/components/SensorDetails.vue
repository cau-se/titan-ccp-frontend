<template>
    <div>
        <b-container>
            <b-row class="mb-4">
                <b-col :cols="isAggregated ? 10 : 12">
                    <sensor-parents :sensor="internalSensor" v-on:select="setSensor"/>
                </b-col>
                <b-col v-if="isAggregated" cols ="2">
                    <b-dropdown right text="Subconsumers" variant="secondary" size="lg" block class="children-dropdown">
                        <b-dropdown-item v-for="child in internalSensor.children" :key="child.identifier" v-on:click="internalSensor = child">
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
                    <sensor-history-plot :sensor="internalSensor" :timeMode="timeMode"  :key="internalSensor.identifier" />
                </b-col>
            </b-row>
            <b-row class="mb-4">
                <b-col cols="6">
                    <distribution-plot :sensor="internalSensor" :timeMode="timeMode"  :key="internalSensor.identifier" />
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
        </b-container>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator"
import { Sensor, AggregatedSensor, MachineSensor, SensorRegistry } from '../SensorRegistry'

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import SensorParents from "./SensorParents.vue"
import DistributionPlot from "./DistributionPlot.vue"
import StatsPlot from "./StatsPlot.vue"
import { HOUR_OF_DAY } from "./StatsPlot.vue"
import { DAY_OF_WEEK } from "./StatsPlot.vue"
import ContributionPieChart from "./ContributionPieChart.vue"
import CompositionPieChart from "./CompositionPieChart.vue"
import SensorHistoryPlot from "./SensorHistoryPlot.vue"
import TrendArrow from "./TrendArrow.vue"
import { Timespan } from "./TrendArrow.vue"
import TimeMode from "../model/time-mode";


@Component({
    components: {
        SensorParents,
        SensorHistoryPlot,
        CompositionPieChart,
        ContributionPieChart,
        DistributionPlot,
        StatsPlot,
        TrendArrow
    }
})
export default class SensorDetails extends Vue {

    @Prop({ required: true }) sensor!: Sensor

    @Prop({ required: true }) timeMode!: TimeMode

    private internalSensor = this.sensor

    readonly trendLastHour = Timespan.LastHour
    readonly trendLastDay = Timespan.LastDay
    readonly trendLastWeek = Timespan.LastWeek

    readonly statsDayOfWeek = DAY_OF_WEEK
    readonly statsHourOfDay = HOUR_OF_DAY

    get isAggregated() {
        return this.internalSensor instanceof AggregatedSensor
    }

    setSensor(sensor: Sensor) {
        this.internalSensor = sensor
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