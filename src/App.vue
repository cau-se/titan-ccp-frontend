<template>
  <div id="app">

    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
      <router-link to="/" class="navbar-brand col-sm-3 col-md-2 mr-0">
        <img src="@/assets/titan-logo.svg" height="24" class="d-inline-block mr-2 align-middle" alt="">
        <span class="align-middle">Titan Control Center</span>
      </router-link>
      <div class="container justify-content-end">
        <ul class="navbar-nav">
          <li class="nav-item text-nowrap">
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
      <nav class="col-md-2 d-none d-md-block bg-light sidebar">
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
              <router-link to="/sensor-management" class="nav-link">
                <font-awesome-icon icon="sliders-h" fixed-width class="feather" />Sensor Management
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

      <div class="col-md-9 ml-sm-auto col-lg-10 d-flex flex-column">
        <main role="main" class="pt-3 px-4 flex-fill">
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
.sidebar .nav-link.router-link-active .feather {
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
  line-height: 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.25);
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
