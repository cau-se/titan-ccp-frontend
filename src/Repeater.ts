export default class Repeater {
  intervalId?: number

  constructor(
    private readonly initialFunction: () => Promise<void>,
    private readonly repeatingFunction: () => void,
    private readonly repeatIntervalInMs: number
  ) {}

  // TODO remove
  async start(): Promise<void> {
    await this.initialFunction()
    this.intervalId = window.setInterval(() => this.repeatingFunction(), this.repeatIntervalInMs)
  }

  // TODO rename to start
  continue(): void {
    this.intervalId = window.setInterval(() => this.repeatingFunction(), this.repeatIntervalInMs)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
  }

  restart(): void {
    this.stop()
    this.start()
  }
}
