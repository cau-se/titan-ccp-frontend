<template>
  <b-container v-if="loaded">
    <b-row class="mb-4">
      <b-col>
        <b-card no-body header="Sensor Hierarchy">
          <dragable-sensor-list :sensors="[modifiableSensorRegistry.topLevelSensor]" flush />
        </b-card>
      </b-col>
      <b-col>
        <b-card no-body header="Unused Sensors">
          <dragable-sensor-list :sensors="unselectedSensors" flush />
        </b-card>

        <b-list-group class="mt-3">
          <b-list-group-item class="d-flex align-items-center">
            <b-input
              v-model="newAggregatedSensorName"
              type="text"
              class="mr-3 w-auto"
              placeholder="New aggregated sensor"
              @keyup.enter.native="addSensor()"
            />
            <code class="mr-auto">{{ newAggregatedSensorIdentifier }}</code>
            <b-button @click="addSensor()" :variant="'link'" class="text-muted">
              <font-awesome-icon icon="check" />
            </b-button>
          </b-list-group-item>
        </b-list-group>

        <div class="error-container">
          <b-alert
            :show="collidedSensorIdentifier"
            dismissible
            variant="warning"
          >Sensor '{{collidedSensorIdentifier}}' already exists</b-alert>
        </div>
      </b-col>
    </b-row>
    <b-row class="mb-4">
      <b-col class="d-flex">
        <b-button :disabled="saving || demoMode" variant="success" @click="save">
          <font-awesome-icon v-if="saving" icon="spinner" spin />
          <template v-else>Save</template>
        </b-button>
        <div class="flex-grow-1 ml-3">
          <b-input-group v-if="showExport">
            <b-input-group-prepend>
              <b-button variant="outline-info" @click="toggleExport">Export</b-button>
            </b-input-group-prepend>
            <b-form-input v-if="showExport" :value="modifiableSensorRegistry.toJson()" @focus="$event.target.select()" autofocus readonly></b-form-input>
            <!--<b-input-group-append v-if="showExport">
              <b-button variant="secondary">Copy</b-button>
            </b-input-group-append>-->
          </b-input-group>
          <b-button v-else @click="toggleExport" variant="outline-info">
            Export
          </b-button>
        </div>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

import { HTTP } from '@/model/http-common'
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry,
  SensorRegistryRequester
} from '@/model/SensorRegistry'
import env from '@/util/Env'

import DragableSensorList from '@/components/DragableSensorList.vue'

@Component({
  components: {
    DragableSensorList
  }
})
export default class SensorHierarchy extends Vue {
  loaded = false;

  @Prop({ required: true })
  sensorRegistry!: SensorRegistry;

  sensorRegistryRequester: SensorRegistryRequester = new SensorRegistryRequester();

  modifiableSensorRegistry: SensorRegistry | null = null;

  saving = false;

  unselectedSensors = new Array<Sensor>();

  newAggregatedSensorName = '';

  collidedSensorIdentifier = null;

  showExport = false;

  async created () {
    if (this.$route.params.id == null) {
      this.$router.replace({
        path: `/sensor-management/${this.sensorRegistry.topLevelSensor.identifier}`
        // name: 'SensorManagement',
        // params: { this.sensorRegistry.topLevelSensor.identifier }
      })
    }

    this.modifiableSensorRegistry = await this.sensorRegistryRequester.request(
      this.$route.params.id
    )
    this.loaded = true

    const response = await HTTP.get('active-power/raw')
    const unselectedSensors = response.data as Array<string>
    const registeredSensors = this.sensorRegistry.registeredSensors.map(
      s => s.identifier
    )
    this.unselectedSensors = unselectedSensors
      .filter(s => !registeredSensors.includes(s))
      .map(s => new MachineSensor(s, ''))
  }

  get demoMode () {
    return env('VUE_APP_DEMO_MODE') === 'true'
  }

  async save () {
    if (this.modifiableSensorRegistry) {
      this.saving = true

      try {
        await this.sensorRegistryRequester.edit(
          this.$route.params.id,
          this.modifiableSensorRegistry
        )
        this.$emit('update:sensor-registry')
      } catch (error) {
        if (
          error.response.data.collisions &&
          error.response.data.collisions.length
        ) {
          this.collidedSensorIdentifier = error.response.data.collisions[0]
        }
      }

      this.saving = false
    }
  }

  async toggleExport () {
    this.showExport = !this.showExport
    // this.$refs.export. $el.focus()
  }

  private addSensor () {
    this.unselectedSensors.push(
      new AggregatedSensor(
        this.newAggregatedSensorIdentifier,
        this.newAggregatedSensorName,
        []
      )
    )
    this.newAggregatedSensorName = ''
  }

  private get newAggregatedSensorIdentifier () {
    return this.slugify(this.newAggregatedSensorName)
  }

  private slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
}
</script>

<style scoped>
.error-container {
  padding-top: 30px;
}
</style>
