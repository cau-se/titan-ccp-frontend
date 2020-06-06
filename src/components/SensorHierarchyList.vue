<template>
  <b-container>
    <b-row class="mb-4">
      <b-col>
        <b-list-group>
          <b-list-group-item
            class="sensor-registry-item"
            v-for="registry in sensorRegistries"
            :key="registry.identifier"
          >
            <router-link
              :to="'/sensor-hierarchy/' + registry.identifier"
              class="flex-1"
            >{{registry.name}}</router-link>
            <b-button @click="deleteSensorRegistry(registry)" :variant="'link'" class="text-muted">
              <font-awesome-icon icon="trash" />
            </b-button>
          </b-list-group-item>
        </b-list-group>
      </b-col>
      <b-col>
        <b-list-group>
          <b-list-group-item class="d-flex align-items-center">
            <b-input
              v-model="newSensorRegistryName"
              type="text"
              class="mr-3 w-auto"
              placeholder="New Sensor Hierarchy"
              @keyup.enter.native="createNewSensorRegistry()"
            />
            <code class="mr-auto">{{ newSensorRegistryName }}</code>
            <b-button @click="createNewSensorRegistry()" :variant="'link'" class="text-muted">
              <font-awesome-icon icon="check" />
            </b-button>
          </b-list-group-item>
          <div class="error-container">
            <b-alert
              :show="hierarchyExists"
              dismissible
              variant="warning"
            >Sensor Hierarchy already exists</b-alert>
            <b-alert :show="error" dismissible variant="warning">An error occurred</b-alert>
          </div>
        </b-list-group>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import { Prop, Vue, Component } from "vue-property-decorator";
import {
  SensorRegistry,
  SensorRegistryRequester,
  JsonSensor
} from "../SensorRegistry";
import { HTTP } from "../http-common";

@Component({})
export default class SensorHierarchyList extends Vue {
  sensorRegistries: JsonSensor[] = [];

  sensorRegistryRequester: SensorRegistryRequester = new SensorRegistryRequester();

  newSensorRegistryName: string = "";

  hierarchyExists: boolean = false;
  error: boolean = false;

  async createNewSensorRegistry() {
    this.error = false;
    this.hierarchyExists = false;
    const name = this.newSensorRegistryName.trim();
    if (name.length) {
      try {
        await this.sensorRegistryRequester.create(this.slugify(name), name);
        this.newSensorRegistryName = "";
        this.sensorRegistries.push({ identifier: this.slugify(name), name });
        this.sensorRegistries.sort((a, b) =>
          a.identifier < b.identifier ? -1 : 1
        );
      } catch (e) {
        if (e.response.status == 409) {
          this.hierarchyExists = true;
        } else {
          this.error = true;
        }
      }
    }
  }

  async created() {
    this.sensorRegistries = await this.sensorRegistryRequester.requestAll();
  }

  async deleteSensorRegistry(registry: JsonSensor) {
    await this.sensorRegistryRequester.delete(registry.identifier);

    const i = this.sensorRegistries.indexOf(registry);
    this.sensorRegistries.splice(i, 1);
  }

  //TODO utility method
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

.sensor-registry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-1 {
  flex: 1;
}
</style>
