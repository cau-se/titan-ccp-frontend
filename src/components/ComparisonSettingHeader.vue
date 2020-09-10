<template>
  <b-row class="text-center">
    <b-col>
      <b-container fluid class="m-md-2">
        <date-range-picker
          ref="picker"
          :timePicker="true"
          :showWeekNumbers="true"
          :autoApply="true"
          v-model="dateRange"
          @update="updateValues"
        >
          <template
            v-slot:input="picker"
            style="min-width: 350px;"
          >{{ picker.startDate | date }} - {{ picker.endDate | date }}</template>
        </date-range-picker>
      </b-container>
    </b-col>
    <b-col>
      <div>
        <b-dropdown variant="success" :text="resolution" class="m-md-2">
          <b-dropdown-item @click="setResolution('1:1')">1:1</b-dropdown-item>
          <b-dropdown-item @click="setResolution('minutely')">minutely</b-dropdown-item>
          <b-dropdown-item @click="setResolution('hourly')">hourly</b-dropdown-item>
        </b-dropdown>
      </div>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import DateRangePicker from "vue2-daterange-picker";
import "vue2-daterange-picker/dist/vue2-daterange-picker.css";

@Component({
  components: {
    DateRangePicker
  },
  filters: {
    date(value: any) {
      if (!value) return "";

      let options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric"
      };
      return Intl.DateTimeFormat("en-EN", options).format(value);
    }
  }
})
export default class comparisonSettingBar extends Vue {
  now = new Date().getTime();
  private dateRange = {
    startDate: new Date(this.now - 2 * 3600 * 1000),
    endDate: new Date(this.now)
  };

  resolution: string = "1:1";

  private updateValues() {
    this.$emit(
      "updatedViewSettings",
      this.dateRange.startDate,
      this.dateRange.endDate,
      this.resolution
    );
  }

  setResolution(resolution: string) {
    this.resolution = resolution;
    this.updateValues();
  }
}
</script>

<style scoped>
</style>