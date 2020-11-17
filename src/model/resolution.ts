import { Interval } from 'luxon';
import { AggregatedSensor, Sensor } from '../SensorRegistry';

export interface Resolution {

  getQueryUrl(sensor: Sensor, range: Interval): string;

  name: string;

  valueAccessor: (json: any, sensor: Sensor) => number;

  timestampAccessor: (json: any, sensor: Sensor) => Date;
}

export class RawResolution implements Resolution {

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  name = 'highest'

  valueAccessor = (json: { sumInW: any; valueInW: any }, sensor: any) => sensor instanceof AggregatedSensor ? json.sumInW : json.valueInW;

  timestampAccessor = (json: { timestamp: string | number | Date }, _: any) => new Date(json.timestamp);

  getQueryUrl(sensor: Sensor, range: Interval) {
    return `${sensor instanceof AggregatedSensor ? 'active-power/aggregated' : 'active-power/raw'}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`;
  }
}

export class WindowedResolution implements Resolution {

  constructor(readonly name: string) {}

  valueAccessor = (json: { mean: any}, _: any) => json.mean;

  timestampAccessor = (json: { startTimestamp: string | number | Date }, _: any) => new Date(json.startTimestamp);

  getQueryUrl(sensor: Sensor, range: Interval) {
    return `active-power/windowed/${this.name}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`;
  }
}
