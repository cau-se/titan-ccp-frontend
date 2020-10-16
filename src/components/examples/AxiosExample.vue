<template>
    <div>
        See console...
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
//import axios from "axios"; //TODO
import { HTTP } from "../../http-common";

@Component
export default class AxiosExample extends Vue {
    
    created() {
        // load photos
        let identifier = "root"
        HTTP.get('active-power/aggregated/' + identifier)
        .then(response => {
            // JSON responses are automatically parsed.
            //console.log(response.data);
        })
        .catch(e => {
            console.log(e);
        });

        // async / await version (created() becomes async created())
        //
        // try {
        //   const response = await axios.get(`http://jsonplaceholder.typicode.com/posts`)
        //   this.posts = response.data
        // } catch (e) {
        //   this.errors.push(e)
        // }
    }
}
</script>

<style scoped>
</style>