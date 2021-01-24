import { Interval } from 'luxon'
import { AggregatedSensor, Sensor } from '@/model/SensorRegistry'

export interface Resolution {
  getQueryUrl(sensor: Sensor, range: Interval): string;

  name: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessValue(json: any, sensor: Sensor): number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessTimestamp(json: any, sensor: Sensor): Date;
}

export class RawResolution implements Resolution {
  readonly name = 'highest'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessValue (json: any, sensor: Sensor) {
    return sensor instanceof AggregatedSensor ? json.sumInW : json.valueInW
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessTimestamp (json: any) {
    return new Date(json.timestamp)
  }

  getQueryUrl (sensor: Sensor, range: Interval) {
    return `${sensor instanceof AggregatedSensor ? 'active-power/aggregated' : 'active-power/raw'}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`
  }
}

export class WindowedResolution implements Resolution {
  // eslint-disable-next-line no-useless-constructor
  constructor (readonly name: string) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessValue (json: any) {
    return json.mean
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessTimestamp (json: any) {
    return new Date(json.startTimestamp)
  }

  getQueryUrl (sensor: Sensor, range: Interval) {
    return `active-power/windowed/${this.name}/${sensor.identifier}?from=${range.start.toMillis()}&to=${range.end.toMillis()}`
  }
}

export class ScalingResolution implements Resolution {
  // eslint-disable-next-line no-useless-constructor
  constructor (private readonly delegate: Resolution, private readonly factor: number) {}

  get name () {
    return this.delegate.name
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessValue (json: any, sensor: Sensor) {
    return this.delegate.accessValue(json, sensor) * this.factor
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessTimestamp (json: any, sensor: Sensor) {
    return this.delegate.accessTimestamp(json, sensor)
  }

  getQueryUrl (sensor: Sensor, range: Interval) {
    return this.delegate.getQueryUrl(sensor, range)
  }
}
