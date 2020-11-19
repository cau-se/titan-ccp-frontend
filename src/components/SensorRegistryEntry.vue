<template>
  <div class="d-flex align-items-center">
    <b-input v-if="edit"
      v-model="sensor.name"
      type="text" class="mr-3 w-auto"
      v-focus placeholder="Sensor name"
      @blur.native="edit = false" @keyup.enter.native="edit = false" />
    <span v-else-if="sensor.name != ''" class="mr-3">{{sensor.name}}</span>
    <code class="mr-auto">{{sensor.identifier}}</code>
    <b-button v-if="!edit" @click="edit = true" :variant="'link'" class="text-muted">
      <font-awesome-icon icon="pen" />
    </b-button>
    <b-button @click="$emit('remove')" :variant="'link'" class="text-muted">
      <font-awesome-icon icon="trash" />
    </b-button>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Sensor } from '../SensorRegistry'

@Component
export default class SensorRegistryEntry extends Vue {
  @Prop({ required: true }) sensor!: Sensor

  private edit = false
}
</script>

<style scoped>
</style>
