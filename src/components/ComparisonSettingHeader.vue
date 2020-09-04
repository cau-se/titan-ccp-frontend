<template>
  <b-row class="text-center">
    <b-col>
      <b-container class="m-md-2">
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
          <b-dropdown-item @click="setResolution('highest')">highest</b-dropdown-item>
          <b-dropdown-item @click="setResolution('hourly')">hourly</b-dropdown-item>
          <b-dropdown-item @click="setResolution('daily')">daily</b-dropdown-item>
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

import TimeMode from "../model/time-mode";

@Component({
  components: {
    DateRangePicker,
  },
  filters: {
    date(value: any) {
      if (!value) return "";

      let options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
      };
      return Intl.DateTimeFormat("en-EN", options).format(value);
    },
  },
})
export default class comparisonSettingBar extends Vue {
  @Prop({ required: true }) timeMode!: TimeMode;

  private get now() {
    return this.timeMode.getTime();
  }

  private dateRange = {
    startDate: this.now.minus({ days: 7 }).toJSDate(),
    endDate: this.now.toJSDate(),
  };

  resolution: string = "highest";

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