import { injectInterval } from "./helpers";

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
