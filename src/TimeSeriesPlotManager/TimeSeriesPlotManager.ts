import { MultiResolutionData } from "./DataSet";
import { DataPoint } from "./DataPoint";
import TimeMode from "../model/time-mode";
import { Domain } from "./Domain";
import { DownloadManager } from "./api";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const debounce = require("lodash.debounce");

// import CanvasTimeSeriesPlot as interface only, shall not get instantiated here for loose coupling
import { CanvasTimeSeriesPlot as TimeSeriesPlot } from "../canvasPlot/CanvasTimeSeriesPlot";

interface PlotManagerConstructor {
  plot: TimeSeriesPlot;
  sensorIdentifier: string;
  isAggregatedSensor: boolean;
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
  private readonly plot: TimeSeriesPlot;
  private readonly data: MultiResolutionData;
  private readonly timeMode: TimeMode;
  private readonly sensorIdentifier: string;
  private readonly isAggregatedSensor: boolean;
  private readonly datasetId: string;
  private readonly defaultTimeSpan: number;
  private readonly yDomainEnlargement: number;
  private readonly plotStartsWithZero: boolean;
  private readonly color: string;

  private latest: number;
  private latestByResolutionLevel: number[];
  private dataPoints: [Date, number][] = [];
  private downloadManager: DownloadManager;

  constructor(config: PlotManagerConstructor) {
    this.plot = config.plot;
    this.data = new MultiResolutionData(3);
    this.sensorIdentifier = config.sensorIdentifier;
    this.isAggregatedSensor = config.isAggregatedSensor;
    this.timeMode = config.timeMode;
    this.latest = this.timeMode.getTime().toMillis() - 3600 * 10000;
    this.datasetId = "measurement";
    this.defaultTimeSpan = config.defaultTimeSpan || 60 * 1000; // one minute
    this.yDomainEnlargement = config.yDomainEnlargement || 0.1;
    this.plotStartsWithZero = config.plotStartsWithZero || true;
    this.color = config.color || "orange";
    this.latestByResolutionLevel = [this.latest, this.latest, this.latest];

    this.plot.setOnZoom(debounce(this.handleZoom, 100));
    this.downloadManager = new DownloadManager(
      this.timeMode,
      this.sensorIdentifier,
      this.isAggregatedSensor
    );
    window.setInterval(this.updateRealTimeData, 5000);

    this.downloadManager
      .fetchNewData(1, this.latest)
      .then((dataPoints) => {
        this.setDataPoints(dataPoints, true);
      })
      .then(() => {
        config.onFinishedLoading && config.onFinishedLoading();
      });
  }

  handleZoom = (xDomainArray: [Date, Date]): void => {
    // calculate the domain span in the plot
    const xDomain = Domain.of(xDomainArray);
    const from = xDomain.start;
    const to = xDomain.end;

    // Define window size for the next data fetch
    const resolutionLevel = this.determineResolutionLevel(xDomain);

    // Start fetching new data with the calculated options
    this.downloadManager
      .fetchNewData(resolutionLevel, from, to)
      .then((dataPoints) => {
        this.injectDataPoints(dataPoints, resolutionLevel);
      });
  };

  updateRealTimeData = async (): Promise<void> => {
    // 1. Determine what data to fetch
    const xDomain = Domain.of(this.plot.getXDomain());
    const resolutionLevel = this.determineResolutionLevel(xDomain);

    // 2. Fetch data asynchronous
    const dataPoints = await this.downloadManager.fetchNewData(
      resolutionLevel,
      this.latestByResolutionLevel[resolutionLevel]
    );
    if (dataPoints.length <= 0) return;
    const latestPointFetched = dataPoints[dataPoints.length - 1];
    const latestFetched = latestPointFetched.date.getTime();

    // 3. Inject data into plot
    this.injectDataPoints(dataPoints, resolutionLevel);

    // 4. Update x domain
    const latest = this.latestByResolutionLevel[resolutionLevel];
    const latestWasDisplayed = latest >= xDomain.start && latest <= xDomain.end;
    if (latestWasDisplayed) {
      const shift =
        latestFetched - this.latestByResolutionLevel[resolutionLevel];
      const newXDomain = Domain.of(xDomain.toArray()).shift(shift);
      this.plot.updateDomains(
        newXDomain.toArray(),
        this.plot.getYDomain(),
        false
      );
    }

    // 5. Set latest fetched data point
    this.latestByResolutionLevel[resolutionLevel] = latestFetched;
  };

  private determineResolutionLevel(xDomain: Domain): number {
    const length = xDomain.getLength();
    if (length <= 15 * 60 * 1000) {
      // less than 15 minutes
      return 0;
    } else if (length <= 10 * 60 * 60 * 1000) {
      // less then 10 hours
      return 1;
    } else {
      return 2;
    }
  }

  /**
   * Removes the old dataset from the plot and adds the specified DataPoints as a new dataset.
   *
   * @param dataPoints - The array of dataPoints to show in the plot.
   * @param updateDomains - Whether to set the x-Domain to contain the new DataPoints.
   */
  private setDataPoints(
    dataPoints: Array<DataPoint>,
    updateDomains?: boolean
  ): void {
    this.dataPoints = [];
    for (const dataPoint of dataPoints) {
      this.dataPoints.push(dataPoint.toArray());
    }
    if (!this.plot) return;
    this.plot.removeDataSet(this.datasetId);
    this.plot.addDataSet(
      this.datasetId,
      "",
      this.dataPoints,
      this.color,
      false,
      false
    );
    if (updateDomains && this.dataPoints.length != 0) {
      this.plot.updateDomains(
        this.plot.calculateXDomain(),
        this.plot.getYDomain(),
        true
      );
      this.updateDomains();
    }
  }

  /**
   *
   * @param dataPointsToInject - 	The array of DataPoints to inject into the dataset.
   * 	This array has to be ordered by its timestamps!
   */
  private injectDataPoints(
    dataPointsToInject: Array<DataPoint>,
    resolutionLevel: number
  ): void {
    // inject new dataPoints into existing ones
    this.data.injectDataPoints(resolutionLevel, dataPointsToInject);
    this.dataPoints = this.data.getDataPoints(resolutionLevel);

    // apply new dataPoints to CanvasPlot
    if (!this.plot) return;
    this.plot.removeDataSet(this.datasetId);
    this.plot.addDataSet(
      this.datasetId,
      "",
      this.data.getDataPoints(resolutionLevel),
      this.color,
      false,
      false
    );

    // recalculate domains
    this.updateDomains();
  }

  private updateDomains(): void {
    if (!this.plot) return;
    const yDomain = Domain.of(this.plot.calculateYDomain());
    const enlargement = yDomain.getLength() * this.yDomainEnlargement;
    yDomain.start -= enlargement;
    yDomain.end += enlargement;
    if (this.plotStartsWithZero) {
      yDomain.start = 0;
    }
    this.plot.updateDomains(this.plot.getXDomain(), yDomain.toArray(), false);
  }
}
