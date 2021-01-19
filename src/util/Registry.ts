export default class Registry<T> {
  registry = new Map<number, T>()
  nextKey = 0

  register (value: T): number {
    this.registry.set(this.nextKey, value)
    const key = this.nextKey
    this.nextKey++
    return key
  }

  get (key: number): T | undefined {
    return this.registry.get(key)
  }

  has (key: number): boolean {
    return this.registry.has(key)
  }
}
