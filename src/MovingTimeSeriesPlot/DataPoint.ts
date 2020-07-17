export class DataPoint {
	public constructor(public date: Date, public value: number) { }

	public toArray(): any[] {
		return [this.date, this.value]
	}
}