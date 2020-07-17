import { DataPoint } from './DataPoint'
import { inject } from './helpers'

describe("Test inject method", () => {

  const existingDataPoints = [
    [new Date(0), 100],
    [new Date(10), 101],
    [new Date(20), 102],
    [new Date(30), 103],

    // higher resolution
    [new Date(35), 104],
    [new Date(40), 105],
    [new Date(45), 106]
  ]

  test('Inject high resolution data between two existing data points works', () => {
    const toInject = [
      new DataPoint(new Date(1), 100.1),
      new DataPoint(new Date(2), 100.2),
      new DataPoint(new Date(3), 100.3)
    ];

    const res = inject(existingDataPoints, toInject);
    expect(res[0][1]).toEqual(100);
    expect(res[1][1]).toEqual(100.1);
    expect(res[2][1]).toEqual(100.2);
    expect(res[3][1]).toEqual(100.3);

    expect(true)
  })
})