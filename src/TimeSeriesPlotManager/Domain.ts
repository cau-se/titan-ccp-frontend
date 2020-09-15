export class TimeDomain {
	public start: number;
	public end: number;

	public constructor(start: number | Date, end: number | Date) {
		if (start instanceof Date) {
			this.start = start.getTime()
		} else {
			this.start = start;
		}

		if (end instanceof Date) {
			this.end = end.getTime();
		} else {
			this.end = end;
		}
	}

	public getLength(): number {
		return this.end - this.start
	}

	public toArray(): [number, number] {
		return [this.start, this.end]
	}

	public toDateArray(): [Date, Date] {
		return [new Date(this.start), new Date(this.end)]
	}

	public shift(time: number): TimeDomain {
		this.start += time;
		this.end += time;
		return this;
	}

	public static of(domain: number[] | Date[]): TimeDomain {
		if (domain.length < 2) {
			new Error('Domain array must have at least two elements.')
		}
		return new TimeDomain(domain[0], domain[1])
	}
}