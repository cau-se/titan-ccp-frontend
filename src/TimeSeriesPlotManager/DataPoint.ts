export class DataPoint {
	public constructor (public date: Date, public value: number) {}

	public toArray (): [Date, number] {
		return [this.date, this.value]
	}
}
