import { Interval } from 'luxon'

import { HTTP } from '@/model/http-common'
import TimeMode from '@/model/time-mode'
import { Resolution } from '@/model/resolution'
import { Sensor } from '@/model/SensorRegistry'

import { DataPoint } from './DataPoint'
import { MultiResolutionData } from './DataSet'

export class DownloadManager {
  private readonly timeMode: TimeMode;
  private readonly data: MultiResolutionData;
  private readonly sensor: Sensor;

  constructor (
    data: MultiResolutionData,
    timeMode: TimeMode,
    sensor: Sensor
  ) {
    this.data = data
    this.timeMode = timeMode
    this.sensor = sensor
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
  public async fetchNewData (
    resolution: Resolution,
    from: number,
    to?: number
  ): Promise<DataPoint[]> {
    const toMillis = to || this.timeMode.getTime().toMillis()

    // 1. determine, which data is already cached
    const intervalsToFetch = this.data.getUncachedIntervals(
      resolution,
      from,
      toMillis
    )

    // 2. Download data in proposed intervals
    const fetchPromises = intervalsToFetch.map((interval) =>
      this.fetchData(resolution, interval[0], interval[1])
    )
    const responses = await Promise.all(fetchPromises)

    // 3. Assemble fetched data to one array
    const fetchedData: DataPoint[] = []
    responses.forEach(dataInInterval => {
      dataInInterval.forEach(dataPoint => fetchedData.push(dataPoint))
    })

    return fetchedData
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
  private fetchData (
    resolution: Resolution,
    from: number,
    to: number
  ): Promise<DataPoint[]> {
    const interval = Interval.fromDateTimes(new Date(from), new Date(to))
    const url = resolution.getQueryUrl(this.sensor, interval)

    return HTTP.get(url).then((response) => {
      // Map the response to an array of datapoints and return it
      return response.data.map((x: { endTimestamp: number; mean: number }) => {
        return new DataPoint(
          resolution.accessTimestamp(x, this.sensor),
          resolution.accessValue(x, this.sensor)
        )
      })
    })
  }
}
