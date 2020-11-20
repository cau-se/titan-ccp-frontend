<template>
  <b-breadcrumb class="sensor-parents">
    <b-breadcrumb-item v-for="sensor in parents" :key="sensor.identifier" @click="select(sensor)" href="#" :text="sensor.title" />
    <b-breadcrumb-item active :text="sensor.title" />
  </b-breadcrumb>
</template>

<script lang="ts">
import { Vue, Component, Prop, Emit } from 'vue-property-decorator'

import { Sensor, AggregatedSensor } from '../SensorRegistry'

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

  @Emit()
  select () {}
}
</script>

<style scoped>
  .sensor-parents {
    margin-bottom: 0;
  }
</style>
