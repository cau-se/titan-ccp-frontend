export class Domain {
	public constructor(public start: number, public end: number) { }

	public getLength(): number {
		return this.end - this.start
	}

	public toArray(): [number, number] {
		return [this.start, this.end]
	}

	public toDateArray(): [Date, Date] {
		return [new Date(this.start), new Date(this.end)]
	}

	public static of(domain: Array<number>): Domain {
		if (domain.length < 2) {
			new Error('Domain array must have at least two elements.')
		}
		return new Domain(domain[0], domain[1])
	}
}