import { Resolution } from "../model/resolution";
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
  private dataSetsPerResolution: {[key: string]: DataSet} = {}

  public constructor(resolutions: Resolution[]){
    resolutions.forEach(res => {
      this.dataSetsPerResolution[res.name] = new DataSet([]);
    });
  }

  public addResolution(resolution: Resolution): void {
    this.dataSetsPerResolution[resolution.name] = new DataSet([]);
  }

  public getDataPoints(resolution: Resolution): d3Point[] {
    return this.dataSetsPerResolution[resolution.name].getDataPoints();
  }

  public setDataPoints(resolution: Resolution, dataPoints: DataPoint[]): void {
    this.dataSetsPerResolution[resolution.name].setDataPoints(dataPoints);
  }

  public injectDataPoints(
    resolution: Resolution,
    dataPoints: DataPoint[]
  ): void {
    this.dataSetsPerResolution[resolution.name].injectDataPoints(dataPoints);
  }

  public getUncachedIntervals(resolution: Resolution, start: number, end: number): [number, number][] {
    return this.dataSetsPerResolution[resolution.name].getUncachedIntervals(
      start,
      end
    );
  }
}
