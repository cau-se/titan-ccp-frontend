<template>
  <anomalies :sensorRegistry="sensorRegistry" :timeMode="timeMode" ></anomalies>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Anomalies from '@/components/Anomalies.vue' // @ is an alias to /src
import { SensorRegistry } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'

@Component({
  components: {
    Anomalies
  }
})
export default class Anomlies extends Vue {
    @Prop({ required: true }) sensorRegistry!: SensorRegistry;

    @Prop() timeMode!: TimeMode
}
</script>
