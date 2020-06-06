<template>
  <b-container v-if="loaded">
    <b-row class="mb-4">
      <b-col>
        <dragable-sensor-list :sensors="[modifiableSensorRegistry.topLevelSensor]" />
      </b-col>
      <b-col>
        <dragable-sensor-list :sensors="unselectedSensors" />
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
      <b-col>
        <b-button :disabled="saving || demoMode" variant="success" @click="save">
          <font-awesome-icon v-if="saving" icon="spinner" spin />
          <template v-else>Save</template>
        </b-button>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry,
  SensorRegistryRequester
} from "../SensorRegistry";
import { HTTP } from "../http-common";

import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

// @ts-ignore
import draggable from "vuedraggable";

import DragableSensorList from "./DragableSensorList.vue";
import SensorRegistryEntry from "./SensorRegistryEntry.vue";

@Component({
  components: {
    DragableSensorList,
    SensorRegistryEntry,
    draggable
  }
})
export default class SensorHierarchy extends Vue {
  loaded: boolean = false;

  sensorRegistry!: SensorRegistry;

  sensorRegistryRequester: SensorRegistryRequester = new SensorRegistryRequester();

  modifiableSensorRegistry: SensorRegistry | null = null;

  saving = false;

  unselectedSensors = new Array<Sensor>();

  newAggregatedSensorName = "";

  collidedSensorIdentifier = null;

  async created() {
    this.sensorRegistry = await this.sensorRegistryRequester.request(
      this.$route.params.id
    );

    this.modifiableSensorRegistry = SensorRegistry.flatCopy(
      this.sensorRegistry
    );
    this.loaded = true;

    const response = await HTTP.get("power-consumption");
    let unselectedSensors = response.data as Array<string>;
    let registeredSensors = this.sensorRegistry.registeredSensors.map(
      s => s.identifier
    );
    this.unselectedSensors = unselectedSensors
      .filter(s => !registeredSensors.includes(s))
      .map(s => new MachineSensor(s, ""));
  }

  get demoMode() {
    return process.env.DEMO === "true";
  }

  async save() {
    if (this.modifiableSensorRegistry) {
      this.saving = true;

      try {
        await this.sensorRegistryRequester.edit(
          this.$route.params.id,
          this.modifiableSensorRegistry
        );
      } catch (error) {
        if (
          error.response.data.collisions &&
          error.response.data.collisions.length
        ) {
          this.collidedSensorIdentifier = error.response.data.collisions[0];
        }
      }

      this.saving = false;
    }
  }

  private addSensor() {
    this.unselectedSensors.push(
      new AggregatedSensor(
        this.newAggregatedSensorIdentifier,
        this.newAggregatedSensorName,
        []
      )
    );
    this.newAggregatedSensorName = "";
  }

  private get newAggregatedSensorIdentifier() {
    return this.slugify(this.newAggregatedSensorName);
  }

  private slugify = (text: String) =>
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
}
</script>

<style scoped>
.error-container {
  padding-top: 30px;
}
</style>
