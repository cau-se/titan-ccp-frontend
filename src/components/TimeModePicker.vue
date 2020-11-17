<template>
  <b-button
      v-if="timeModeLocal.autoLoading == true"
      @click="setStartDate(false)"
      variant="link"
      class="play-pause-button">
      <font-awesome-icon icon="history" />
  </b-button>
  <div v-else class="form-inline">
      <flat-pickr
      placeholder="Select date"
      v-model="date"
      class="date-picker form-control text-center"
      :config="flatPickrConfig"
      @on-close="checkDateChanged()"
      @on-open="setOldDate()"
      ></flat-pickr>
      <b-button @click="setStartDate(true)" variant="link" class="play-pause-button">
      <font-awesome-icon icon="play" />
      </b-button>
  </div>
</template>

<script lang="ts">
import { DateTime } from 'luxon'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import TimeMode from '../model/time-mode'
import 'flatpickr/dist/flatpickr.css'
import flatPickr from 'vue-flatpickr-component'

@Component({
    components: {
    flatPickr
    }
})
export default class TimeModePicker extends Vue {
  @Prop({ required: true }) timeMode!: TimeMode;

  private timeModeLocal: TimeMode = {
    autoLoading: this.timeMode.autoLoading,
    getTime: () => this.timeMode.getTime()
  };

  private date: string = new Date().toISOString();
  private oldDate: string = this.date;

  private readonly flatPickrConfig = {
    allowInput: true,
    // eslint-disable-next-line @typescript-eslint/camelcase
    time_24hr: true,
    enableTime: true
  };

  setOldDate () {
    this.oldDate = this.date
  }

  checkDateChanged () {
    if (this.oldDate !== this.date) {
      this.setStartDate(false)
    }
  }

  setStartDate (now: boolean) {
    if (!now) {
      this.timeModeLocal = {
        autoLoading: false,
        getTime: () => DateTime.fromJSDate(new Date(this.date))
      }
    } else {
      this.timeModeLocal = {
        autoLoading: true,
        getTime: () => DateTime.local() // now
      }
      this.date = new Date().toISOString()
    }
    this.$emit('update-timeMode', this.timeModeLocal)
  }
}
</script>

<style scoped>
.date-picker {
  width: 10em;
}

.play-pause-button {
  color: #aaa;
}
</style>
