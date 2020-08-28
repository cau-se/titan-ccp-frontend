<template>
  <b-row class="text-center">
    <b-col>
      <b-container fluid class="center">
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
      <b-button variant="success" @click="setResolution">Set resolution</b-button>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ComparisonSettingBar from "./../model/comparison-view-settings";

import DateRangePicker from "vue2-daterange-picker";
import "vue2-daterange-picker/dist/vue2-daterange-picker.css";
import ComparisonViewSettings from "./../model/comparison-view-settings";

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
  private dateRange = {
    startDate: 0,
    endDate: 0
  };

  private resolution: number = 0;

  private updateValues() {
    console.log(this.dateRange.startDate);
    this.$emit(
      "updatedViewSettings",
      this.dateRange.startDate,
      this.dateRange.endDate,
      0
    );
  }

  setResolution() {}
}
</script>

<style scoped>
</style>