<template>
  <div class="card">
    <div class="card-body">
      <b-row>
        <b-col cols="6">
          <h5 class="card-title">{{ statsType.title }}</h5>
        </b-col>
        <b-col cols="6">
          <b-form-select
            v-if="selectedInterval"
            v-model="selectedInterval"
            :options="intervalSelectOptions"
            class="mb-3"
          ></b-form-select>
        </b-col>
      </b-row>
      <loading-spinner :is-loading="isLoading" :is-error="isError">
        <div class="c3-container"></div>
      </loading-spinner>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import LoadingSpinner from "./LoadingSpinner.vue";
import { HTTP } from "../http-common";
import { Sensor, AggregatedSensor } from "../SensorRegistry";
import { ChartAPI, generate } from "c3";
import "c3/c3.css";
import { DateTime, Interval } from "luxon";
import TimeMode from "../model/time-mode";

@Component({
  components: {
    LoadingSpinner,
  },
})
export default class StatsPlot extends Vue {
  @Prop({ required: true }) sensor!: Sensor;

  @Prop({ required: true }) statsType!: StatsType;

  @Prop({ required: true }) timeMode!: TimeMode;

  private availableIntervals: Interval[] = [];
  private selectedInterval: Interval | null = null;

  private chart!: ChartAPI;

  private isLoading = true;
  private isError = false;

  get intervalSelectOptions(): Array<IntervalSelectOption> {
    return this.availableIntervals.map((i) => new IntervalSelectOption(i));
  }

  mounted() {
    this.chart = generate({
      bindto: this.$el.querySelector(".c3-container") as HTMLElement,
      data: {
        x: "x",
        columns: [],
        type: "spline",
      },
      legend: {
        show: false,
      },
      axis: {
        x: {
          type: "category",
          tick: {
            multiline:false,
          }
        },
        y: {
          min: 0,
        },
      },
      grid: {
        x: {
          show: true,
        },
        y: {
          show: true,
        },
      },
      tooltip: {
        show: false,
      },
    });
    this.loadAvailableIntervals().then(() => this.createPlot());
  }

  @Watch("sensor")
  onSensorChanged(sensor: Sensor) {
    this.createPlot();
  }

  private loadAvailableIntervals() {
    return HTTP.get(`/stats/interval/${this.statsType.url}`).then(
      (response) => {
        this.availableIntervals = response.data.map((i: any) =>
          Interval.fromDateTimes(
            DateTime.fromISO(i.intervalStart),
            DateTime.fromISO(i.intervalEnd)
          )
        );
      }
    );
  }

  @Watch("selectedInterval")
  onIntervalChanged(interval: Interval, oldInterval: Interval) {
    if (oldInterval != null) {
      this.createPlot(interval);
    }
  }

  private createPlot(interval?: Interval) {
    let defaultInterval = this.availableIntervals.find(interval => interval.end >= this.timeMode.getTime())! ||  this.availableIntervals[this.availableIntervals.length - 1];
    let interval2 = interval || defaultInterval;

    let url = `stats/sensor/${this.sensor.identifier}/${
      this.statsType.url
    }?intervalStart=${this.dateTimeToBackendISO(
      interval2.start
    )}&intervalEnd=${this.dateTimeToBackendISO(interval2.end)}`;

    HTTP.get(url)
      .then((response) => {
        // JSON responses are automatically parsed.
        let labels: string[] = ["x"];
        let minValues: Array<string | number> = ["min"];
        let meanValues: Array<string | number> = ["mean"];
        let maxValues: Array<string | number> = ["max"];
        for (let stats of response.data) {
          labels.push(this.statsType.accessor(stats));
          minValues.push(stats.min / 1000);
          meanValues.push(stats.mean / 1000);
          maxValues.push(stats.max / 1000);
        }
        // Update selected interval
        if (response.data.length > 0 && this.selectedInterval == null) {
          this.selectedInterval = Interval.fromDateTimes(
            DateTime.fromMillis(response.data[0].periodStart),
            DateTime.fromMillis(response.data[0].periodEnd)
          );
        }
        //return [labels, minValues, meanValues, maxValues]
        return [labels, meanValues];
      })
      .catch((e) => {
        console.error(e);
        this.isError = true;
        //return [["x"], ["min"], ["mean"], ["max"]]
        return [["x"], ["mean"]];
      })
      .then((data) => {
        this.chart.load({
          columns: data,
          unload: true,
        });
        this.isLoading = false;
      });
  }

  private dateTimeToBackendISO(dateTime: DateTime): string {
    return dateTime.toUTC().toISO({ suppressMilliseconds: true });
  }
}

class IntervalSelectOption {
  public readonly value: Interval;
  public readonly text: string;

  constructor(interval: Interval) {
    this.value = interval;
    this.text = interval.toFormat("yyyy/MM/dd");
  }
}

export interface StatsType {
  title: string;
  url: string;
  accessor: (stats: any) => string;
}

export const HOUR_OF_DAY: StatsType = {
  title: "Daily Course",
  url: "hour-of-day",
  accessor: (stats) => stats.hourOfDay,
};

export const DAY_OF_WEEK: StatsType = {
  title: "Weekly Course",
  url: "day-of-week",
  accessor: (stats) => getDayOfWeekText(stats.dayOfWeek),
};

function getDayOfWeekText(number: number) {
  switch (number) {
    case 1: {
      return "Monday";
    }
    case 2: {
      return "Tuesday";
    }
    case 3: {
      return "Wednesday";
    }
    case 4: {
      return "Thursday";
    }
    case 5: {
      return "Friday";
    }
    case 6: {
      return "Saturday";
    }
    case 7: {
      return "Sunday";
    }
    default: {
      throw new RangeError("Day of week number must be between 1 and 7");
    }
  }
}
</script>

<style scoped>
.c3-container {
  height: 300px;
}
</style>
<style>
.c3-grid line {
  stroke: #dfdfdf;
}
.c3-xgrid,
.c3-ygrid {
  stroke-dasharray: 0;
}
</style>
