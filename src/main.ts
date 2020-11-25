import Vue from 'vue'
import App from './App.vue'
import router from './router'

import BootstrapVue from 'bootstrap-vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTachometerAlt, faChartBar, faBalanceScale, faSlidersH, faPlay, faMinus, faArrowRight, faPen, faTrash, faSpinner, faChartLine, faCog, faTimes, faPause, faCheck, faHistory } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

Vue.config.productionTip = false

Vue.use(BootstrapVue)

library.add(faTachometerAlt, faChartBar, faBalanceScale, faSlidersH, faPlay, faMinus, faArrowRight, faPen, faTrash, faSpinner, faChartLine, faCog, faTimes, faPause, faCheck, faHistory)
Vue.component('font-awesome-icon', FontAwesomeIcon)

// Check if needed
Vue.directive('focus', {
  inserted: function (el) {
    el.focus()
  }
})
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
