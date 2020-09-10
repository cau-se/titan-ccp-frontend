<template>
  <b-row class="text-right">
    <b-col>
        Time range:
        <date-range-picker
          ref="picker"
          :timePicker="true"
          :showWeekNumbers="true"
          :ranges="defaultRanges"
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
  
        Resolution:
        <b-dropdown variant="outline-secondary" :text="resolutionNew" class="m-md-2">
          <b-dropdown-item @click="$emit('update-resolution', 'highest')">highest</b-dropdown-item>
          <b-dropdown-item @click="$emit('update-resolution', 'minutely')">minutely</b-dropdown-item>
          <b-dropdown-item @click="$emit('update-resolution', 'hourly')">hourly</b-dropdown-item>
          <!--<b-dropdown-item @click="$emit('update-resolution', 'daily')">daily</b-dropdown-item>-->
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
  @Prop({ required: true }) timeMode!: TimeMode;

  @Prop({ required: true }) resolutionNew!: string;

  @Prop({ required: true }) rangeNew!: Interval;

  // modifiable in contrast to rangeNew
  private dateRange = {
    startDate: this.rangeNew.start.toJSDate(),
    endDate: this.rangeNew.end.toJSDate()
  };

  private updateRange() {
    this.$emit(
      "update-range",
      Interval.fromDateTimes(
        DateTime.fromJSDate(this.dateRange.startDate),
        DateTime.fromJSDate(this.dateRange.endDate))
    );
  }

  private get defaultRanges() {
    let now = this.timeMode.getTime();
    let today = now.set({
      hour: 0,
      minute: 0,
      second: 0
    });
    let yesterday = today.minus({days: 1});
    let thisMonthStart = now.set({
      day: 1,
      hour: 0,
      minute: 0,
      second: 0
    });
    let lastMonthStart = thisMonthStart.minus({month: 1});
    let thisYearStart = now.set({
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0
    });

    return {
        'Today': [today.toJSDate(), today.plus({days: 1}).minus({seconds: 1}).toJSDate()],
        'Yesterday': [yesterday.toJSDate(), yesterday.plus({days: 1}).minus({seconds: 1}).toJSDate()],
        'This month': [thisMonthStart.toJSDate(), thisMonthStart.plus({month: 1}).minus({seconds: 1}).toJSDate()],
        'This year': [thisYearStart.toJSDate(), thisYearStart.plus({year: 1}).minus({seconds: 1}).toJSDate()],
        'Last month': [lastMonthStart.toJSDate(), lastMonthStart.plus({month: 1}).minus({seconds: 1}).toJSDate()],
    }
  }
}
</script>

<style scoped>
</style>