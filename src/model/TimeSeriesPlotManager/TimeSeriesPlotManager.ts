import debounce from 'lodash.debounce'

import { MultiResolutionData } from './DataSet'
import { DataPoint } from './DataPoint'
import TimeMode from '@/model/time-mode'
import { TimeDomain } from './Domain'
import { DownloadManager } from './api'

// import CanvasTimeSeriesPlot as interface only, shall not get instantiated here for loose coupling
import { CanvasTimeSeriesPlot as TimeSeriesPlot } from '@/model/canvasPlot/CanvasTimeSeriesPlot'
import { Sensor } from '@/model/SensorRegistry'
import { RawResolution, Resolution, WindowedResolution } from '@/model/resolution'
import { HTTP } from '@/model/http-common'

interface PlotManagerConstructor {
  plot: TimeSeriesPlot;
  sensor: Sensor;
  timeMode: TimeMode;
  defaultTimeSpan?: number;
  yDomainEnlargement?: number;
  plotStartsWithZero?: boolean;
  color?: string;
  onFinishedLoading?: () => void;
}

/**
 * This class handles all data for the given TimeSeriesPlot.
 * It loads new data points every x seconds, handles zoom events in the plots and manages data prefetching.
 */
export class TimeSeriesPlotManager {
  private readonly DEFAULT_RESOLUTION = new RawResolution();
  private readonly resolutionToTimeRange = new Map<string, number>([
    ['minutely', 15 * 60 * 1000], // 15 minutes
    ['hourly', 11 * 60 * 60 * 1000], // 11 hours
    ['monthly', 30 * 24 * 60 * 60 * 1000] // 30 days
  ]);

  private readonly plot: TimeSeriesPlot;
  private readonly data: MultiResolutionData;
  private readonly timeMode: TimeMode;
  private readonly datasetId: string;
  private readonly yDomainEnlargement: number;
  private readonly plotStartsWithZero: boolean;
  private readonly color: string;
  private readonly sensor: Sensor;

  private readonly availableResolutions: Resolution[] = [this.DEFAULT_RESOLUTION]
  private readonly latestByResolution = new Map<Resolution, number>()
  private oldYStart: number;
  private oldYEnd: number;
  private latest: number;
  private downloadManager: DownloadManager;

  /**
   * Constructor
   */
  constructor (config: PlotManagerConstructor) {
    this.plot = config.plot
    this.data = new MultiResolutionData([this.DEFAULT_RESOLUTION])
    this.sensor = config.sensor
    this.timeMode = config.timeMode
    this.latest = this.timeMode.getTime().toMillis() - 3600 * 10000
    this.datasetId = 'measurement'
    this.yDomainEnlargement = config.yDomainEnlargement || 0.1
    this.plotStartsWithZero = config.plotStartsWithZero || true
    this.color = config.color || 'orange'
    this.latestByResolution.set(this.DEFAULT_RESOLUTION, this.latest)
    this.oldYStart = 0
    this.oldYEnd = 0

    this.plot.setOnZoom(debounce(this.handleZoom, 100))
    this.downloadManager = new DownloadManager(
      this.data,
      this.timeMode,
      this.sensor
    )

    this.loadAvailableResolutions()
      .then(resolutions => this.addAvailableResolutions(resolutions))
      .then(() => {
        window.setInterval(this.updateRealTimeData, 5000)
        this.fetchFirstData(config.onFinishedLoading)
      })
  }

  // fetch first data
  private fetchFirstData (onFinishedLoading: (() => void) | undefined): void {
    const startTimeDomain = TimeDomain.of([this.latest, this.timeMode.getTime().toMillis()])
    const startResolution = (this.determineResolution(startTimeDomain))

    this.downloadManager.fetchNewData(startResolution, this.latest).then((dataPoints) => {
      this.injectDataPoints(dataPoints, startResolution, true)
      onFinishedLoading && onFinishedLoading()
      // set timestamp of latest point fetched
      if (dataPoints.length > 0) {
        const latestPoint = dataPoints[dataPoints.length - 1]
        const latest = latestPoint.date.getTime()
        this.latestByResolution.set(startResolution, latest)
      }
    })
  }

  private addAvailableResolutions (resolutions: Resolution[]): void {
    resolutions.forEach(
      res => {
        this.availableResolutions.push(res)
        this.latestByResolution.set(res, this.latest)
        this.data.addResolution(res)
      })
  }

  private async loadAvailableResolutions (): Promise<Resolution[]> {
    return await HTTP.get('active-power/windowed').then(
      response => response.data.map((i: string) => new WindowedResolution(i))
    )
  }

  handleZoom = (xDomainArray: [Date, Date]): void => {
    // calculate the domain span in the plot
    const xDomain = TimeDomain.of(xDomainArray)
    const span = xDomain.getLength()
    let from = xDomain.start
    let to = xDomain.end

    // triple the size of the interval to fetch as a simple prefetch
    from -= span
    to += span

    // Define window size for the next data fetch
    const resolution = this.determineResolution(xDomain)

    // Start fetching new data with the calculated options
    this.downloadManager
      .fetchNewData(resolution, from, to)
      .then((dataPoints) => {
        this.injectDataPoints(dataPoints, resolution)
      })
  };

  updateRealTimeData = async (): Promise<void> => {
    // 1. Determine what data to fetch
    const xDomain = TimeDomain.of(this.plot.getXDomain())
    const resolution = this.determineResolution(xDomain)

    // 2. Fetch data asynchronous
    const dataPoints = await this.downloadManager.fetchNewData(
      resolution,
      this.latestByResolution.get(resolution) || this.latest
    )
    if (dataPoints.length <= 0) return
    const latestPointFetched = dataPoints[dataPoints.length - 1]
    const latestFetched = latestPointFetched.date.getTime()

    // 3. Inject data into plot
    this.injectDataPoints(dataPoints, resolution)

    // 4. Update x domain
    const latest = this.latestByResolution.get(resolution) || this.latest
    const latestWasDisplayed = latest >= xDomain.start && latest <= xDomain.end
    if (latestWasDisplayed) {
      const latestOfCurrentResolution = this.latestByResolution.get(resolution) || this.latest
      const shift = latestFetched - latestOfCurrentResolution
      const newXDomain = TimeDomain.of(xDomain.toArray()).shift(shift)
      this.plot.updateDomains(
        newXDomain.toArray(),
        this.plot.getYDomain(),
        false
      )
    }

    // 5. Set latest fetched data point
    this.latestByResolution.set(resolution, latestFetched)
  };

  private determineResolution (xDomain: TimeDomain): Resolution {
    const length = xDomain.getLength()
    let highestMinimalLength = 0
    let determinedResolution: Resolution = this.DEFAULT_RESOLUTION

    // search lowest resolution as possible
    this.availableResolutions.forEach((resolution) => {
      const minimalLength = this.resolutionToTimeRange.get(resolution.name) || 0
      if (length > minimalLength && minimalLength > highestMinimalLength) {
        highestMinimalLength = minimalLength
        determinedResolution = resolution
      }
    })
    return determinedResolution
  }

  /**
   *
   * @param dataPointsToInject - The array of DataPoints to inject into the dataset. This array has to be ordered by its timestamps!
   */
  private injectDataPoints (
    dataPointsToInject: Array<DataPoint>,
    resolution: Resolution,
    updateDomains?: boolean
  ): void {
    // inject new dataPoints into existing ones
    this.data.injectDataPoints(resolution, dataPointsToInject)
    const dataPoints = this.data.getDataPoints(resolution)
    if (dataPoints.length <= 0) return

    // apply new dataPoints to CanvasPlot
    if (!this.plot) return
    this.plot.removeDataSet(this.datasetId)
    this.plot.addDataSet(
      this.datasetId,
      '',
      dataPoints,
      this.color,
      false,
      false
    )

    // recalculate domains
    if (updateDomains) {
      this.plot.updateDomains(
        this.plot.calculateXDomain(),
        this.plot.getYDomain(),
        true
      )
    }
    this.updateDomains()
  }

  private updateDomains (): void {
    if (!this.plot) return
    const yDomain = TimeDomain.of(this.plot.calculateYDomain())
    const enlargement = yDomain.getLength() * this.yDomainEnlargement
    yDomain.start -= enlargement
    yDomain.end += enlargement

    yDomain.start = this.oldYStart > yDomain.start ? this.oldYStart : yDomain.start
    yDomain.end = this.oldYEnd > yDomain.end ? this.oldYEnd : yDomain.end

    this.oldYStart = yDomain.start
    this.oldYEnd = yDomain.end

    if (this.plotStartsWithZero) {
      yDomain.start = 0
    }
    this.plot.updateDomains(this.plot.getXDomain(), yDomain.toArray(), false)
  }
}
