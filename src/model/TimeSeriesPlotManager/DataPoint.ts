export class DataPoint {
  // eslint-disable-next-line no-useless-constructor
  public constructor (public date: Date, public value: number) {}

  public toArray (): [Date, number] {
    return [this.date, this.value]
  }
}
