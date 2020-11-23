import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

import Dashboard from '@/views/Dashboard.vue'
import SensorDetails from '@/views/SensorDetails.vue'
import Comparison from '@/views/Comparison.vue'
import SensorHierarchy from '@/views/SensorHierarchy.vue'
import PageNotFound from '@/views/PageNotFound.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/sensor-details',
    name: 'SensorDetails',
    component: SensorDetails
  },
  {
    path: '/comparison',
    name: 'Comparison',
    component: Comparison
  },
  {
    path: '/sensor-management/:id?',
    name: 'SensorManagement',
    component: SensorHierarchy
  },
  // The following route is kept as an examkple for lazy-loaded views
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '*',
    name: 'PageNotFound',
    component: PageNotFound
  }
]

const router = new VueRouter({
  routes
})

export default router
