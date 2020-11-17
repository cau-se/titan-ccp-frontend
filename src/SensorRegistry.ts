import { HTTP } from './http-common'
import { AxiosPromise } from 'axios'

export type Sensor = AggregatedSensor | MachineSensor;

export class AggregatedSensor {
  constructor (
    readonly identifier: string,
    readonly name: string,
    readonly children: Array<Sensor>
  ) {}

  public parent?: AggregatedSensor // TODO make nicer

  get title (): string {
    return this.name !== '' ? this.name : this.identifier
  }

  get recursiveChildren (): Array<Sensor> {
    let children = new Array<Sensor>()
    for (const child of this.children) {
      children.push(child)
      if (child instanceof AggregatedSensor) {
        children = children.concat(child.recursiveChildren)
      }
    }
    return children
  }
}

export class MachineSensor {
  constructor (readonly identifier: string, readonly name: string) { }

  parent?: AggregatedSensor // TODO make nicer

  get title (): string {
    return this.name !== '' ? this.name : this.identifier
  }
}

export class SensorRegistry {
  constructor (readonly topLevelSensor: Sensor) { }

  public static parse (sensor: JsonSensor): SensorRegistry {
    return new SensorRegistry(this.parseSensor(sensor))
  }

  public get registeredSensors (): Array<Sensor> {
    let registeredSensors = new Array<Sensor>()
    registeredSensors.push(this.topLevelSensor)
    if (this.topLevelSensor instanceof AggregatedSensor) {
      registeredSensors = registeredSensors.concat(this.topLevelSensor.recursiveChildren)
    }
    return registeredSensors
  }

  public toJson (pretty?: boolean): string {
    return JSON.stringify(this.topLevelSensor, (key, val) => key !== 'parent' ? val : undefined, pretty ? '\t' : undefined)
  }

  public toPrettyJson (): string {
    return this.toJson(true)
  }

  private static parseSensor (sensor: JsonSensor): Sensor {
    if (sensor.children) {
      const children = sensor.children.map(child => this.parseSensor(child))
      const parsedSensor = new AggregatedSensor(sensor.identifier, sensor.name ? sensor.name : '', children)
      children.forEach(child => { child.parent = parsedSensor })
      return parsedSensor
    } else {
      return new MachineSensor(sensor.identifier, sensor.name ? sensor.name : '')
    }
  }

  public static flatCopy (sensorRegistry: SensorRegistry): SensorRegistry {
    return new SensorRegistry(this.flatCopySensor(sensorRegistry.topLevelSensor))
  }

  private static flatCopySensor (sensor: Sensor): Sensor {
    if (sensor instanceof AggregatedSensor) {
      const children = sensor.children.map(child => this.flatCopySensor(child))
      return new AggregatedSensor(sensor.identifier, sensor.name, children)
    } else {
      return new MachineSensor(sensor.identifier, sensor.name)
    }
  }
}

export interface JsonSensor {
  identifier: string;
  name?: string;
  children?: Array<JsonSensor>;
}

export class SensorRegistryRequester {
  public async request (identifier: string): Promise<SensorRegistry> {
    const response = await HTTP.get(`sensor-hierarchy/${identifier}`)
    // JSON responses are automatically parsed.
    // console.log(response.data);
    return SensorRegistry.parse((response.data as JsonSensor))
  }

  public async requestAll (): Promise<JsonSensor[]> {
    const response = await HTTP.get('sensor-hierarchy/')
    return response.data
  }

  public create (identifier: string, name: string): AxiosPromise {
    const newTopLevelSensor = new AggregatedSensor(identifier, name, [])
    return HTTP.post('sensor-hierarchy', newTopLevelSensor)
  }

  public edit (name: string, registry: SensorRegistry): AxiosPromise {
    return HTTP.put('sensor-hierarchy/' + name, registry.toJson())
  }

  public delete (name: string): AxiosPromise {
    return HTTP.delete('sensor-hierarchy/' + name)
  }
}
