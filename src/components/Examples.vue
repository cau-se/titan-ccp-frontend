<template>
    <div>
        <b-container class="">
            <b-row>
                <b-col>
                    <b-card title="Card Title"
                            img-src="https://lorempixel.com/600/300/food/5/"
                            img-alt="Image"
                            img-top 
                            tag="article"
                            class="mb-2">
                        <p class="card-text">
                        Some quick example text to build on the card title and make up the bulk of the card's content.
                        </p>
                        <b-button href="#" variant="primary">Go somewhere</b-button>
                    </b-card>
                </b-col>
                <b-col>
                    <b-card title="Card Title"
                            img-src="https://lorempixel.com/600/300/food/5/"
                            img-alt="Image"
                            img-top 
                            tag="article"
                            class="mb-2">
                        <p class="card-text">
                        Some quick example text to build on the card title and make up the bulk of the card's content.
                        </p>
                        <b-button href="#" variant="primary">Go somewhere</b-button>
                    </b-card>
                </b-col>
                <b-col>
                    <b-card title="Card Title"
                            img-src="https://lorempixel.com/600/300/food/5/"
                            img-alt="Image"
                            img-top 
                            tag="article"
                            class="mb-2">
                        <p class="card-text">
                        Some quick example text to build on the card title and make up the bulk of the card's content.
                        </p>
                        <b-button href="#" variant="primary">Go somewhere</b-button>
                    </b-card>
                </b-col>
            </b-row>
            <b-row>
                <b-col>
                    Name: <input v-model="name" type="text">
                <hello-decorator :name="name" :initialEnthusiasm="5" />
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator"

import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import Main2 from "./Main2.vue"

import HelloDecorator from "./examples/HelloDecorator.vue"
import AxiosExample from "./examples/AxiosExample.vue"
import CanvasTimeSeriesPlotExample from "./examples/CanvasTimeSeriesPlotExample.vue"
import BritechartsExample from "./examples/BritechartsExample.vue"
import C3Example from "./examples/C3Example.vue"
import C3PieExample from "./examples/C3PieExample.vue"

@Component({
    components: {
        HelloDecorator,
        AxiosExample,
        CanvasTimeSeriesPlotExample,
        C3Example,
        C3PieExample
    }
})
export default class Examples extends Vue {

    readonly name = "World"

    private show = false;

}
</script>

<style scoped>

</style>