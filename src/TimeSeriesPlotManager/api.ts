import TimeMode from "../model/time-mode";
import { DataPoint } from "./DataPoint";
import { HTTP } from "../http-common";

const resolutionToEndpointDictionary = ["raw", "minutely", "hourly"];

export class DownloadManager {
  private readonly timeMode: TimeMode;
  private readonly sensorIdentifier: string;
  private readonly isAggregatedSensor: boolean;

  constructor(timeMode: TimeMode, sensorIdentifier: string, isAggregatedSensor = false) {
    this.timeMode = timeMode;
    this.sensorIdentifier = sensorIdentifier;
    this.isAggregatedSensor = isAggregatedSensor;
  }

  /**
   * Fetches new data for the current sensor.
   *
   * @param windowSize - Determines the temporal resolution of the returned data.
   * @param from - The earliest data to fetch.
   * @param to - The latest data to fetch.
   *
   * @returns Promise resolving to an array of DataPoints.
   */
  public fetchNewData(
    resolutionLevel: number,
    from: number,
    to?: number
  ): Promise<DataPoint[]> {
    const toMillis = to ? to : this.timeMode.getTime().toMillis();
    const fetchPromise =
        resolutionLevel === 0
        ? this.fetchNewRawData(from, toMillis)
        : this.fetchNewWindowedData(resolutionLevel, from, toMillis);

    // save latest received timestamp
    fetchPromise.then((dataPoints) => {
      // TODO: Push to manager
      // if (dataPoints.length > 0 && windowSize === "raw" && !to) {
      //   this.latest = dataPoints[dataPoints.length - 1].date.getTime();
      // }
      return dataPoints;
    });

    return fetchPromise;
  }

  /**
   * Fetches windowed data for the current sensor.
   *
   * @param windowSize - Determines the temporal resolution of the returned data.
   * @param from - The earliest data to fetch.
   * @param to - The latest data to fetch.
   *
   * @returns Promise resolving to an array of DataPoints.
   */
  public fetchNewWindowedData(
    resolutionLevel: number,
    from: number,
    to: number
  ): Promise<DataPoint[]> {
    const windowSize = resolutionToEndpointDictionary[resolutionLevel];
    const resource = `active-power/windowed/${windowSize}/${this.sensorIdentifier}`;
    const params = `?from=${from}&to=${to}`;
    const url = resource + params;
    return HTTP.get(url).then((response) => {
      // Map the response to an array of datapoints and return it
      return response.data.map((x: any) => {
        return new DataPoint(new Date(x.endTimestamp), x.mean);
      });
    });
  }

  /**
   * Fetches raw data for the current sensor, which means a maximum temporal resolution.
   *
   * @param windowSize - Determines the temporal resolution of the returned data.
   * @param from - The earliest data to fetch.
   * @param to - The latest data to fetch.
   *
   * @returns Promise resolving to an array of DataPoints.
   */
  public fetchNewRawData(from: number, to: number): Promise<DataPoint[]> {
    const resource = this.isAggregatedSensor
      ? "aggregated-power-consumption/"
      : "power-consumption/";
    const identifier = this.sensorIdentifier;
    const params = `?from=${from}&to=${to}`;
    const url = resource + identifier + params;
    return HTTP.get(url).then((response) => {
      // Map response to an array of DataPoints and return it
      return response.data.map((x: any) => {
        const date = new Date(x.timestamp);
        const value = this.isAggregatedSensor ? x.sumInW : x.valueInW;
        return new DataPoint(date, value);
      });
    });
  }
}
