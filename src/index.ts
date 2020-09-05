import Vue from "vue";
import VueRouter from "vue-router"
import BootstrapVue from 'bootstrap-vue'
import App from "./components/App.vue"

import Dashboard from "./components/Dashboard.vue"
import SensorDetails from "./components/SensorDetails.vue"
import Comparison from "./components/Comparison.vue"
import SensorHierarchy from "./components/SensorHierarchy.vue"
//import SensorHierarchyList from "./components/SensorHierarchyList.vue"
import Anomalies from "./components/Anomalies.vue"
import Examples from "./components/Examples.vue"

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTachometerAlt, faChartBar, faBalanceScale, faSlidersH, faPlay, faMinus, faArrowRight, faPen, faTrash, faSpinner, faChartLine, faCog, faTimes, faPause, faCheck, faHistory, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

if (process.env.DEMO === "true") {
  console.log("Start in demo mode.")
}
if (process.env.SHOW_COMPLETE_HISTORY === "true") {
  console.log("Show complete history.")
}

Vue.use(BootstrapVue);

library.add(faTachometerAlt, faChartBar, faBalanceScale, faSlidersH, faPlay, faMinus, faArrowRight, faPen, faTrash, faSpinner, faChartLine, faCog, faTimes, faPause, faCheck, faHistory, faExclamationTriangle)
Vue.component('font-awesome-icon', FontAwesomeIcon)
//Vue.config.productionTip = false

Vue.use(VueRouter);

Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  }
})

// 0. If using a module system (e.g. via vue-cli), import Vue and VueRouter
// and then call `Vue.use(VueRouter)`.

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/', component: Dashboard },
  { path: '/sensor-details', component: SensorDetails },
  { path: '/comparison', component: Comparison },
  { path: '/anomalies', component: Anomalies },
  { path: '/sensor-management/:id?', component: SensorHierarchy },
  //{ path: '/sensor-hierarchy', component: SensorHierarchyList },
  { path: '/examples', component: Examples }
]

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes: routes,
  //mode: 'history',
})

new Vue({
  el: '#app',
  components: { App },
  template: '<app />',
  router: router
});
