<template>
  <div id="app">

    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
      <router-link to="/" class="navbar-brand bg-dark col-sm-3 col-md-2 mr-0">
        <img src="@/assets/titan-logo.svg" height="28" class="d-inline-block mr-3 align-middle" alt="">
        <span class="align-middle">Titan Control Center</span>
      </router-link>
      <div class="container justify-content-end">
        <ul class="navbar-nav mr-4">
          <li v-if="flowEngineUrl" class="nav-item text-nowrap justify-content-end">
            <a class="nav-link" :href="flowEngineUrl">Titan Flow</a>
          </li>
        </ul>
        <ul class="navbar-nav d-flex flex-row-reverse">
          <li class="nav-item">
            <time-mode-picker
              :timeMode="timeMode"
              @update-timeMode="updateTimeMode">
            </time-mode-picker>
          </li>
        </ul>
      </div>
    </nav>

    <!--<div class="container-fluid">-->
    <div class="row no-gutters">
      <nav class="col-md-2 d-none d-md-block bg-dark sidebar">
        <div class="sidebar-sticky">
          <ul class="nav flex-column">
            <li class="nav-item">
              <router-link to="/" exact class="nav-link">
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

      <div class="col-md-9 ml-sm-auto col-lg-10 d-flex flex-column">
        <main role="main" class="pt-4 px-4 flex-fill">
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
        <footer class="footer">
          <div class="container-fluid">
            <div class="text-muted row">
              <div class="text-center col">
                <p class="mb-0 py-3">
                  The
                  <a href="https://github.com/cau-se/titan-ccp">Titan Control Center</a>
                  is free and open source software as part of the
                  <a href="https://www.industrial-devops.org/en">Titan project on Industrial DevOps</a>.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { DateTime } from 'luxon'
import { SensorRegistry, SensorRegistryRequester } from '@/model/SensorRegistry'
import TimeMode from '@/model/time-mode'
import env from '@/util/Env'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import BootstrapVue from 'bootstrap-vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'

import LoadingSpinner from '@/components/LoadingSpinner.vue'
import TimeModePicker from '@/components/TimeModePicker.vue'

@Component({
  components: {
    LoadingSpinner,
    TimeModePicker
  }
})
export default class App extends Vue {
  private sensorRegistry: SensorRegistry | null = null;
  private isLoading = false;
  private isError = false;
  private timeMode: TimeMode = App.getDefaultTimeMode();
  private readonly flowEngineUrl?: string = env('VUE_APP_FLOW_ENGINE_URL');

  updateTimeMode (timeMode: TimeMode) {
    this.timeMode = timeMode
  }

  created () {
    this.isLoading = true
    this.loadSensorRegistry()
      .then(() => {
        this.isLoading = false
      })
      .catch(e => {
        this.isLoading = false
        this.isError = true
        console.error(e)
      })
  }

  loadSensorRegistry () {
    return new SensorRegistryRequester()
      .request('root')
      .then((registry: SensorRegistry) => {
        this.sensorRegistry = registry
        return registry
      })
  }

  static getDefaultTimeMode () {
    const timeModeNow = env('VUE_APP_TIME_MODE_NOW')
    if (timeModeNow === undefined) {
      return {
        autoLoading: true,
        getTime: () => DateTime.local() // now
      }
    } else {
      return {
        autoLoading: false,
        getTime: () => DateTime.fromISO(timeModeNow)
      }
    }
  }
}
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;1,400&display=swap');
</style>
<style lang="scss">
  @import '@/assets/custom.scss';
  // Bootstrap and its default variables
  // @import '../node_modules/bootstrap/scss/bootstrap.scss';
  // BootstrapVue and its default variables
  // @import '../node_modules/bootstrap-vue/src/index.scss';
</style>
<style scoped>
/*
 * Sidebar
 */

.sidebar {
  /* position: fixed; */
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100; /* Behind the navbar */
  padding: 0;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.sidebar-sticky {
  /*position: -webkit-sticky;*/
  position: sticky;
  top: 68px; /* Height of navbar */
  height: calc(100vh - 68px);
  padding-top: 0.5rem;
  overflow-x: hidden;
  overflow-y: auto; /* Scrollable contents if viewport is shorter than content. */
}

.sidebar .nav-item {
  padding: 0.25em;
}

.sidebar .nav-link {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
}

.sidebar .nav-link .feather {
  color: inheit;
  margin-right: 16px;
}

.sidebar .nav-link:hover,
.sidebar .nav-link.router-link-active {
  color: #FFFFFF;
}

.sidebar-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
}

/*
 * Navbar
 */

.navbar-dark {
  background-color: #3c4450 !important;
}
.navbar-brand {
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
  padding-left: 1.1rem;
  padding-right: 1.1rem;
  font-size: 1.25rem;
  line-height: 1rem;
  /* background-color: rgba(0, 0, 0, 0.25); */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.25);
}

.navbar-nav .nav-link {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  letter-spacing: 0.04rem;
  text-transform: uppercase;
}

.footer{
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.1);
}
</style>
<style>
svg.britechart .tick text {
    font-size: 10px;
}
</style>
