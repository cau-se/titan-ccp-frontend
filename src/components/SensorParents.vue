<template>
  <b-card no-body>
    <b-breadcrumb class="sensor-parents">
      <b-breadcrumb-item v-for="sensor in sensor.allParents" :key="sensor.identifier" :to="buildPath(sensor)" :text="sensor.title" />
      <b-breadcrumb-item active :text="sensor.title" />
    </b-breadcrumb>
  </b-card>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

import { Sensor, AggregatedSensor } from '@/model/SensorRegistry'

@Component
export default class SensorParents extends Vue {
  @Prop({ required: true }) sensor!: Sensor

  get parents () {
    const parents = [this.sensor]
    while (parents[parents.length - 1].parent) {
      parents.push(parents[parents.length - 1].parent as AggregatedSensor) // cast shouldn't be necessary
    }
    return parents.reverse().slice(0, -1)
  }

  buildPath (sensor: Sensor): string {
    return '/sensor-details/' + [...sensor.allParents, sensor].map(s => s.identifier).join('/')
  }
}
</script>

<style scoped>
  .sensor-parents {
    margin-bottom: 0;
  }
</style>
