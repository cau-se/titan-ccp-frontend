import { DataPoint } from "./DataPoint";
import {
  inject,
  injectInterval,
  invertedIntervalIntersections,
} from "./helpers";

type d3Point = [Date, number];

class DataSet {
  private dataPoints: d3Point[] = [];

  /**
   * Ordered (!) array of intervals representing the intervals of already fetched data.
   */
  private cachedIntervals: [number, number][] = [];

  public constructor(dataPoints: DataPoint[]) {
    this.dataPoints = dataPoints.map((dataPoint) => dataPoint.toArray());
  }

  public getDataPoints(): d3Point[] {
    return this.dataPoints;
  }

  public getCachedIntervals(): [number, number][] {
    return this.cachedIntervals;
  }

  public getUncachedIntervals(start: number, end: number): [number, number][] {
    return invertedIntervalIntersections(this.cachedIntervals, start, end);
  }

  public setDataPoints(dataPoints: DataPoint[]): void {
    this.cachedIntervals = [];
    this.dataPoints = dataPoints.map((dataPoint) => dataPoint.toArray());
  }

  public injectDataPoints(dataPoints: DataPoint[]): void {
    if (dataPoints.length <= 0) return;

    this.dataPoints = inject(this.dataPoints, dataPoints);

    const start = dataPoints[0].date.getTime();
    const end = dataPoints[dataPoints.length - 1].date.getTime();
    this.cachedIntervals = injectInterval(this.cachedIntervals, start, end);
  }
}

export class MultiResolutionData {
  private readonly dataSetsPerResolution: DataSet[] = [];

  public constructor(numberOfResolutionLevels: number) {
    for (let i = 0; i < numberOfResolutionLevels; i++) {
      this.dataSetsPerResolution.push(new DataSet([]));
    }
  }

  public getDataPoints(resolutionLevel: number): d3Point[] {
    return this.dataSetsPerResolution[resolutionLevel].getDataPoints();
  }

  public setDataPoints(resolutionLevel: number, dataPoints: DataPoint[]): void {
    this.dataSetsPerResolution[resolutionLevel].setDataPoints(dataPoints);
  }

  public injectDataPoints(
    resolutionLevel: number,
    dataPoints: DataPoint[]
  ): void {
    this.dataSetsPerResolution[resolutionLevel].injectDataPoints(dataPoints);
  }

  public getUncachedIntervals(resolutionLevel: number, start: number, end: number): [number, number][] {
    return this.dataSetsPerResolution[resolutionLevel].getUncachedIntervals(
      start,
      end
    );
  }
}
