import { injectInterval, invertedIntervalIntersections } from "./helpers";

describe("Test injectInterval", () => {
  const intervals: [number, number][] = [
    [5, 10],
    [15, 20],
  ];

  test("It should inject interval before other intervals", () => {
    const res = injectInterval(intervals, 1, 4);
    expect(res.length).toBe(3);
    expect(res[0]).toEqual([1, 4]);
  });

  test("It should inject interval after other intervals", () => {
    const res = injectInterval(intervals, 21, 30);
    expect(res.length).toBe(3);
    expect(res[2]).toEqual([21, 30]);
  });

  test("It should inject interval within existing interval", () => {
    const res = injectInterval(intervals, 5, 10);
    expect(res).toEqual(intervals);
  });

  test("It should inject interval spanning over two existing intervals", () => {
    const res = injectInterval(intervals, 7, 17);
    expect(res).toEqual([[5, 20]]);
  });

  test("It should inject interval bigger than any other", () => {
    const res = injectInterval(intervals, 1, 40);
    expect(res).toEqual([[1, 40]]);
  });
});

describe("Test invertedIntervalIntersection", ()=> {
  const intervals: [number, number][] = [
    [5, 10],
    [15, 20]
  ]

  test("It should return nothing on existing intervals", () => {
    const res = invertedIntervalIntersections(intervals, 6, 9);
    expect(res).toEqual([]);
  })

  test("It should return the whole interval if there is no overlap", () => {
    const res = invertedIntervalIntersections(intervals, 11, 14);
    expect(res).toEqual([[11, 14]]);
  })

  test("It should return split intervals when spanning over existing intervals", ()=> {
    const res = invertedIntervalIntersections(intervals, 0, 30);
    expect(res).toEqual([[0, 5], [10, 15], [20, 30]])
  })

  test("It should return interval before existing intervals", () => {
    const res = invertedIntervalIntersections(intervals, 0, 4);
    expect(res).toEqual([[0, 4]]);
  })

  test ("It should resturn interval after existing intervals", ()=> {
    const res = invertedIntervalIntersections(intervals, 21, 30);
    expect(res).toEqual([[21, 30]])
  })
})
