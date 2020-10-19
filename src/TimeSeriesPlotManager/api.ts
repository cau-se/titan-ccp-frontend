import TimeMode from "../model/time-mode";
import { DataPoint } from "./DataPoint";
import { HTTP } from "../http-common";
import { MultiResolutionData } from "./DataSet";

const resolutionToEndpointDictionary = ["raw", "minutely", "hourly"];

export class DownloadManager {
  private readonly timeMode: TimeMode;
  private readonly sensorIdentifier: string;
  private readonly isAggregatedSensor: boolean;
  private readonly data: MultiResolutionData;

  constructor(
    data: MultiResolutionData,
    timeMode: TimeMode,
    sensorIdentifier: string,
    isAggregatedSensor = false
  ) {
    this.data = data;
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
  public async fetchNewData(
    resolutionLevel: number,
    from: number,
    to?: number
  ): Promise<DataPoint[]> {
    const toMillis = to ? to : this.timeMode.getTime().toMillis();

    // 1. determine, which data is already cached
    const intervalsToFetch = this.data.getUncachedIntervals(
      resolutionLevel,
      from,
      toMillis
    );
    // console.log(
    //   `Called to fetch ${new Date(from).toLocaleString("de")} - ${new Date(
    //     toMillis
    //   ).toLocaleString("de")}. Caching alorithm proposed to download:`
    // );
    // intervalsToFetch.forEach(interval => {
    //   console.log(`${(new Date(interval[0])).toLocaleString("de")} - ${(new Date(interval[1])).toLocaleString("de")}`)
    // })

    // 2. Download data in proposed intervals
    const fetchPromises = intervalsToFetch.map((interval) =>
      resolutionLevel === 0
        ? this.fetchNewRawData(interval[0], interval[1])
        : this.fetchNewWindowedData(resolutionLevel, interval[0], interval[1])
    );
    const responses = await Promise.all(fetchPromises);

    // 3. Assemble fetched data to one array
    const fetchedData: DataPoint[] = [];
    responses.forEach(dataInInterval => {
      dataInInterval.forEach(dataPoint => fetchedData.push(dataPoint));
    })

    return fetchedData;
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
  private fetchNewWindowedData(
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
      return response.data.map((x: { endTimestamp: number; mean: number }) => {
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
  private fetchNewRawData(from: number, to: number): Promise<DataPoint[]> {
    const resource = this.isAggregatedSensor
      ? "aggregated-power-consumption/"
      : "power-consumption/";
    const identifier = this.sensorIdentifier;
    const params = `?from=${from}&to=${to}`;
    const url = resource + identifier + params;
    return HTTP.get(url).then((response) => {
      // Map response to an array of DataPoints and return it
      return response.data.map(
        (x: { timestamp: number; sumInW: number; valueInW: number }) => {
          const date = new Date(x.timestamp);
          const value = this.isAggregatedSensor ? x.sumInW : x.valueInW;
          return new DataPoint(date, value);
        }
      );
    });
  }
}
