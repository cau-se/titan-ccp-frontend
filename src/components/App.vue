<template>
  <div>
    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
      <router-link to="/" class="navbar-brand col-sm-3 col-md-2 mr-0">Titan Control Center</router-link>
      <div class="container justify-content-end">
        <ul class="navbar-nav">
          <li class="nav-item text-nowrap">
            <b-button
              v-if="timeMode.autoLoading == true"
              @click="setStartDate(false)"
              variant="link"
              class="play-pause-button"
            >
              <font-awesome-icon icon="history" />
            </b-button>
            <div v-else class="form-inline">
              <flat-pickr
                placeholder="Select date"
                v-model="date"
                class="date-picker form-control text-center"
                :config="flatPickrConfig"
                @on-close="checkDateChanged()"
                @on-open="setOldDate()"
              ></flat-pickr>
              <b-button @click="setStartDate(true)" variant="link" class="play-pause-button">
                <font-awesome-icon icon="play" />
              </b-button>
            </div>
          </li>
        </ul>
      </div>
    </nav>

    <div class="container-fluid">
      <div class="row">
        <nav class="col-md-2 d-none d-md-block bg-light sidebar">
          <div class="sidebar-sticky">
            <ul class="nav flex-column">
              <li class="nav-item">
                <router-link to="/" class="nav-link">
                  <font-awesome-icon icon="tachometer-alt" fixed-width class="feather" />Dashboard
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/sensor-details" class="nav-link">
                  <font-awesome-icon icon="chart-bar" fixed-width class="feather" />Sensor Details
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/comparison" class="nav-link">
                  <font-awesome-icon icon="balance-scale" fixed-width class="feather" />Comparison
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/anomalies" class="nav-link">
                  <font-awesome-icon icon="exclamation-triangle" fixed-width class="feather" />Anomalies
                </router-link>
              </li>
              <li class="nav-item">
                <router-link to="/sensor-management" class="nav-link">
                  <font-awesome-icon icon="sliders-h" fixed-width class="feather" />Sensor Management
                </router-link>
              </li>
            </ul>
          </div>
        </nav>

        <main role="main" class="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
          <loading-spinner :is-loading="isLoading" :is-error="isError">
            <router-view
              v-if="sensorRegistry != null"
              :sensor="sensorRegistry.topLevelSensor"
              :sensorRegistry="sensorRegistry"
              :timeMode="timeMode"
              @update:sensor-registry="loadSensorRegistry"
            ></router-view>
          </loading-spinner>
        </main>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import VueRouter from "vue-router";
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry,
} from "../SensorRegistry";

import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { SensorRegistryRequester } from "../SensorRegistry";

import LoadingSpinner from "./LoadingSpinner.vue";
import Dashboard from "./Dashboard.vue";
import SensorDetails from "./SensorDetails.vue";
import SensorHierarchy from "./SensorHierarchy.vue";
import SensorHierarchyList from "./SensorHierarchyList.vue";
import { DateTime } from "luxon";
import flatPickr from "vue-flatpickr-component";
import DateRangePicker from "vue2-daterange-picker";
import Anomalies from "./Anomalies.vue";

import "flatpickr/dist/flatpickr.css";
import TimeMode from "./../model/time-mode";

@Component({
  components: {
    LoadingSpinner,
    Dashboard,
    SensorDetails,
    SensorHierarchy,
    SensorHierarchyList,
    flatPickr,
    Anomalies
  },
})
export default class App extends Vue {
  private sensorRegistry: SensorRegistry | null = null;

  private isLoading = false;

  private isError = false;

  private flatPickrConfig = {
    allowInput: true,
    time_24hr: true,
    enableTime: true,
  };

  private timeMode: TimeMode = {
    //autoLoading: true,
    autoLoading: false,
    //getTime: () => DateTime.local() // now
    getTime: () => DateTime.local(2018, 9, 7, 14, 0),
  };

  //private date: string = new Date().toISOString();
  private date: string = this.timeMode.getTime().toJSDate().toISOString();
  private oldDate: string = this.date;

  setOldDate() {
    this.oldDate = this.date;
  }

  checkDateChanged() {
    if (this.oldDate !== this.date) {
      this.setStartDate(false);
    }
  }

  setStartDate(now: boolean) {
    if (!now) {
      this.timeMode = {
        autoLoading: false,
        getTime: () => DateTime.fromJSDate(new Date(this.date)),
      };
    } else {
      this.timeMode = {
        autoLoading: true,
        //getTime: () => DateTime.local() // now
        getTime: () => DateTime.utc(2018, 9, 7, 14, 0),
      };
      this.date = new Date().toISOString();
    }
  }

  created() {
    this.isLoading = true;
    this.loadSensorRegistry()
      .then((_) => {
        this.isLoading = false;
      })
      .catch((e) => {
        this.isLoading = false;
        this.isError = true;
        console.error(e);
      });
  }

  loadSensorRegistry() {
    return new SensorRegistryRequester()
      .request("root")
      .then((registry: SensorRegistry) => {
        this.sensorRegistry = registry;
        return registry;
      });
  }
}
</script>

<style scoped>
/*
 * Sidebar
 */

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100; /* Behind the navbar */
  padding: 0;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.sidebar-sticky {
  position: -webkit-sticky;
  position: sticky;
  top: 48px; /* Height of navbar */
  height: calc(100vh - 48px);
  padding-top: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

.sidebar .nav-link {
  font-weight: 500;
  color: #333;
}

.sidebar .nav-link .feather {
  color: #aaa;
  margin-right: 4px;
}

/*
.sidebar .nav-link.active {
  color: #007bff;
}
*/

.sidebar .nav-link:hover .feather,
.sidebar .nav-link.router-link-exact-active .feather {
  color: inherit;
}

.sidebar-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
}

/*
 * Navbar
 */

.navbar-brand {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.25);
}

/*
 * History dropdown
 */
.date-picker {
  width: 10em;
}

.play-pause-button {
  color: #aaa;
}
</style>