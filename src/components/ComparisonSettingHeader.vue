<template>
  <b-row class="text-right">
    <b-col>
      Time range:
      <date-range-picker
        ref="picker"
        :timePicker="true"
        :showWeekNumbers="true"
        :showDropdowns="true"
        :ranges="defaultRanges"
        :autoApply="true"
        v-model="dateRange"
        @update="updateRange"
        class="mr-md-2"
      >
        <template
          v-slot:input="picker"
          style="min-width: 350px;">
          {{ picker.startDate | date }} - {{ picker.endDate | date }}
        </template>
      </date-range-picker>

      Resolution:
      <b-dropdown variant="outline-secondary" :text="resolution.name">
        <b-dropdown-item
          v-for="resolution in availableResolutions"
          :key="resolution.name"
          @click="$emit('update-resolution', resolution)">
          {{ resolution.name }}
        </b-dropdown-item>
      </b-dropdown>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

import DateRangePicker from "vue2-daterange-picker";
import "vue2-daterange-picker/dist/vue2-daterange-picker.css";

import TimeMode from "../model/time-mode";
import { DateTime, Interval } from "luxon";
import { Resolution } from "../model/resolution";

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
        hour: "numeric",
        hour12: false,
        minute: "numeric"
      };
      return Intl.DateTimeFormat("en-EN", options).format(value);
    }
  }
})
export default class comparisonSettingBar extends Vue {
  @Prop({ required: true }) timeMode!: TimeMode;

  @Prop({ required: true }) resolution!: Resolution;

  @Prop({ required: true }) range!: Interval;

  @Prop({ required: true }) availableResolutions!: Resolution[];

  // modifiable in contrast to range
  private dateRange = {
    startDate: this.range.start.toJSDate(),
    endDate: this.range.end.toJSDate()
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