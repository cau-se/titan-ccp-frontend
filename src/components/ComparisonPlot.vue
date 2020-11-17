<template>
  <div class="card-group row no-gutters">
    <div class="card col-9">
      <div class="canvasplot-container"></div>
    </div>
    <div class="card col-3">
      <div class="card-header">
        Data Sets
        <b-button-close @click="remove()" />
      </div>
      <ul class="list-group list-group-flush">
        <li v-for="dataSet in dataSets" :key="dataSet.sensor.identifier" class="list-group-item">
          {{ dataSet.sensor.title }}
          <b-button-close @click="removeDataSet(dataSet)" />
        </li>
        <li class="list-group-item">
          <b-button
            variant="success"
            v-if="!addDataSetActive"
            @click="addDataSetActive = true"
          >Add Data Set</b-button>
          <treeselect
            v-else
            v-model="newDataSet"
            :options="[ this.sensorRegistry.topLevelSensor ]"
            :normalizer="covertSensorToSelectable"
            :clearable="false"
            valueFormat="object"
            @input="addDataSet()"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { HTTP } from '../http-common'
import {
  Sensor,
  AggregatedSensor,
  MachineSensor,
  SensorRegistry,
} from '../SensorRegistry'
import ColorRepository from '../ColorRepository'
// @ts-ignore
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
// @ts-ignore
import { CanvasTimeSeriesPlot } from '../canvasPlot/CanvasTimeSeriesPlot'
import { DataPoint } from '../TimeSeriesPlotManager'
import { DateTime, Interval } from 'luxon'
import { Resolution } from '../model/resolution'

declare var d3version3: any

@Component({
  components: {
    Treeselect
  }
})
export default class ComparisonPlot extends Vue {
  @Prop({ required: true }) resolution!: Resolution;

  @Prop({ required: true }) range!: Interval;

  dataSets = new Array<DataSet>();

  newDataSet: Sensor | null = null;

  addDataSetActive = false;

  value = null;

  get options () {
    return [this.sensorRegistry.topLevelSensor]
  }

  @Prop({ required: true })
  sensorRegistry!: SensorRegistry;

  @Prop() domainX!: Array<Date>;

  @Prop()
  colors!: ColorRepository;

  private plot!: CanvasTimeSeriesPlot; // Will definitely be assigned in mounted

  get canvasplotContainer () {
    return this.$el.querySelector('.canvasplot-container')!
  }

  covertSensorToSelectable (sensor: Sensor) {
    if (sensor instanceof AggregatedSensor) {
      return {
        id: sensor.identifier,
        label: sensor.title,
        children: sensor.children
      }
    } else {
      return {
        id: sensor.identifier,
        label: sensor.title
      }
    }
  }

  mounted () {
    this.plot = new CanvasTimeSeriesPlot(
      d3version3.select(this.canvasplotContainer),
      [
        this.canvasplotContainer.clientWidth,
        this.canvasplotContainer.clientHeight
      ],
      {
        yAxisLabel: 'Active Power in Watt',
        // plotMargins: { top: 20, right: 20, bottom: 30, left: this.yAxisSpacing },
        updateViewCallback: this.updatedView.bind(this)
      }
    )
    this.plot.setZoomYAxis(false)
  }

  remove () {
    this.$emit('remove')
  }

  removeDataSet (dataSet: DataSet) {
    this.dataSets.splice(this.dataSets.indexOf(dataSet), 1)
    this.colors.free(dataSet.sensor.identifier)
    this.plot.removeDataSet(dataSet.sensor.identifier)
  }

  async addDataSet () {
    if (this.newDataSet) {
      let dataSet = new DataSet(this.newDataSet)
      this.dataSets.push(dataSet)
      this.newDataSet = null
      this.addDataSetActive = false

      let dataPoints = await this.fetchNewData(dataSet.sensor)
      this.plot.addDataSet(
        dataSet.sensor.identifier,
        dataSet.sensor.title,
        dataPoints.map(dataPoint => dataPoint.toArray()),
        this.colors.get(dataSet.sensor.identifier), // color
        true, // updateDomains
        false
      )
    }
  }

  // TODO Reduce duplicate code
  async refreshDataSet (dataSet: DataSet) {
    let dataPoints = await this.fetchNewData(dataSet.sensor)
    this.plot.removeDataSet(dataSet.sensor.identifier)
    this.plot.addDataSet(
      dataSet.sensor.identifier,
      dataSet.sensor.title,
      dataPoints.map((dataPoint) => dataPoint.toArray()),
      this.colors.get(dataSet.sensor.identifier), // color
      true, // updateDomains
      false
    )
  }

  updatedView (except: any, xDomain: any, yDomain: any) {
    this.$emit('update-domain-x', xDomain)
  }

  @Watch('domainX')
  syncView () {
    let currentXDomain = this.plot.getXDomain()
    if (
      currentXDomain[0].getTime() !== this.domainX[0].getTime() ||
      currentXDomain[1].getTime() !== this.domainX[1].getTime()
    ) {
      this.plot.updateDomains(this.domainX, this.plot.getYDomain(), false)
    }
  }

  @Watch('resolution')
  @Watch('range')
  onSettingsChanged () {
    for (let dataSet of this.dataSets) {
      this.refreshDataSet(dataSet)
    }
  }

  private fetchNewData (sensor: Sensor): Promise<DataPoint[]> {
    return HTTP.get(this.resolution.getQueryUrl(sensor, this.range))
      .then((response) => {
        // JSON responses are automatically parsed.
        console.log('response', response)
        return response.data.map(
          (x: any) =>
            new DataPoint(
              this.resolution.timestampAccessor(x, sensor),
              this.resolution.valueAccessor(x, sensor)
            )
        )
      })
      .catch((e) => {
        console.error(e)
        return []
      })
  }
}

class DataSet {
  constructor(readonly sensor: Sensor) {}
}
</script>

<style scoped>
.canvasplot-container {
  height: 300px;
}
.card-group {
  width: 100%;
}
.card-body {
  width: 100%;
}
</style>