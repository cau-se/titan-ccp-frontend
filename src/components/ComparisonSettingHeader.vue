<template>
  <b-row class="text-right">
    <b-col>
      <date-range-picker
          ref="picker"
          :timePicker="true"
          :showWeekNumbers="true"
          :autoApply="true"
          v-model="dateRange"
          @update="updateRange"
          class="m-md-2"
        >
          <template
            v-slot:input="picker"
            style="min-width: 350px;">
            {{ picker.startDate | date }} - {{ picker.endDate | date }}
          </template>
        </date-range-picker>
        <b-dropdown variant="success" :text="resolutionNew" class="m-md-2">
          <b-dropdown-item @click="$emit('update-resolution', 'highest')">highest</b-dropdown-item>
          <b-dropdown-item @click="$emit('update-resolution', 'hourly')">hourly</b-dropdown-item>
          <b-dropdown-item @click="$emit('update-resolution', 'daily')">daily</b-dropdown-item>
        </b-dropdown>
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
import { DateTime, Interval } from "luxon";

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

  @Prop({ required: true }) resolutionNew!: string;

  @Prop({ required: true }) rangeNew!: Interval;

  private get now() {
    return this.timeMode.getTime();
  }

  // private dateRange = {
  //   startDate: this.now.minus({ days: 7 }).toJSDate(),
  //   endDate: this.now.toJSDate(),
  // };

  // modifiable in contrast to rangeNew
  private dateRange = {
    startDate: this.rangeNew.start.toJSDate(),
    endDate: this.rangeNew.end.toJSDate()
  };

  private updateRange() {
    this.$emit(
      "update-range",
      Interval.fromDateTimes(
        DateTime.fromJSDate(new Date(this.dateRange.startDate)),
        DateTime.fromJSDate(new Date(this.dateRange.endDate)))
    );
  }
}
</script>

<style scoped>
</style>