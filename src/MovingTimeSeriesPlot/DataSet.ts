import { DataPoint } from './DataPoint'

type d3Point = [Date, number];

class DataSet {
  private dataPoints: d3Point[] = [];

  public constructor(dataPoints: DataPoint[]) {
    this.dataPoints = dataPoints.map(dataPoint => dataPoint.toArray());
  }

  public getDataPoints(): d3Point[] {
    return this.dataPoints;
  }

  public setDataPoints(dataPoints: DataPoint[]): void {
    this.dataPoints = dataPoints.map(dataPoint => dataPoint.toArray());
  }

  public injectDataPoints(dataPoints: DataPoint[]): void {
    // TODO implement me!
    this.dataPoints = dataPoints.map(dataPoint => dataPoint.toArray());
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

  public injectDataPoints(resolutionLevel: number, dataPoints: DataPoint[]): void {
    this.dataSetsPerResolution[resolutionLevel].injectDataPoints(dataPoints);
  }
}

