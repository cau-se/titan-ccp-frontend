<template>
    <div class="wrapper">
        <div v-if="isLoading" class="icon-container">
            <font-awesome-icon icon="cog" spin class="icon" />
        </div>
        <div v-else-if="isError"  class="icon-container">
            <font-awesome-icon icon="times" class="icon" />
            <p class="text-muted">Could not connect to server</p>
        </div>
        <div :class="{ hidden: isLoading||isError }">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator"

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

@Component
export default class LoadingSpinner extends Vue {

    @Prop({ required: true }) isLoading!: boolean

    @Prop() isError = false

}
</script>

<style scoped>
    .wrapper {
        position: relative;
    }
    .icon-container {
        position: absolute;
        width: 100%;
        height: 100%;
        margin-top: 10%;
        text-align: center;
    }
    .icon {
        font-size: 8em;
        color: rgba(0,0,0,0.5);
    }
    .hidden {
        visibility: hidden;
    }
</style>
