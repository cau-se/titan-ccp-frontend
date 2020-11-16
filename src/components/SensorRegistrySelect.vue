<template>
  <div class="">
    <treeselect v-model="value" :multiple="true" :options="options" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { SensorRegistryRequester, AggregatedSensor, Sensor, SensorRegistry } from '../SensorRegistry'
import { HTTP } from "../http-common";

@Component
export default class SensorRegistrySelect extends Vue {
  @Prop({ required: true }) sensorRegistry!: SensorRegistry
}
</script>

<style scoped>
</style>
