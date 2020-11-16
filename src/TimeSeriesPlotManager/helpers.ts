import { DataPoint } from "./DataPoint";

/** Returns a new array containing the new DataPoints injected into the existing ones.
 * Pure function.
 *
 * @param existingDataPoints - this.dataPoints.
 * @param toInject - The DataPoints to inject into the existing dataPoints.
 */
function inject(
  existingDataPoints: [Date, number][],
  toInject: Array<DataPoint>
): [Date, number][] {
  let existingCounter = 0;
  let injectCounter = 0;

  const resultArray = [];
  while (
    existingCounter < existingDataPoints.length ||
    injectCounter < toInject.length
  ) {
    const existingDate: Date | number =
      existingCounter < existingDataPoints.length
        ? existingDataPoints[existingCounter][0]
        : Infinity;
    const injectDate: Date | number =
      injectCounter < toInject.length
        ? toInject[injectCounter].toArray()[0]
        : Infinity;

    if (existingDate < injectDate) {
      resultArray.push(existingDataPoints[existingCounter]);
      existingCounter++;
    } else {
      resultArray.push(toInject[injectCounter].toArray());
      injectCounter++;
    }
  }
  return resultArray;
}

/**
 * Injects a new interval into an array of existing intervals.
 * Intervals may get merged based on the new interval in order to return non-overlapping intervals.
 * 
 * @param existingIntervals - An array of non-overlapping intervals. Does not have to be sorted necessarily.
 * @param start - The start timestamp of the interval to inject.
 * @param end - The end timestamp of the interval to inject.
 * 
 * @returns array of non-overlapping intervals.
 */
function injectInterval(
  existingIntervals: [number, number][],
  start: number,
  end: number
): [number, number][] {
  // append interval to inject
  let intervals: [number, number][] = [...existingIntervals, [start, end]];

  // sort by start of interval
  intervals = intervals.sort((a, b) => a[0] - b[0]);

  // merge intervals if needed
  const mergedIntervals: [number, number][] = [];
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    const lastInterval = mergedIntervals[mergedIntervals.length - 1];
    if (mergedIntervals.length <= 0 || lastInterval[1] < interval[0]) {
      mergedIntervals.push(interval);
    } else {
      lastInterval[1] = Math.max(lastInterval[1], interval[1]);
    }
  }

  return mergedIntervals;
}

/**
 * Returns intervals, that lay WITHIN [start, end] but are NOT covered by the existing intervals.
 * 
 * @param existingIntervals - Array of intervals. Have to be sorted by interval begin!
 * @param start - Start timestamp of the interval to calculate the inverted intersections for.
 * @param end - Start timestamp of the interval to calculate the inverted intersections for.
 * 
 * @returns array of intervals
 *
 * @example
 * const existingIntervals = [[5, 10],[15, 20]];
 * invertedIntervalIntersections(existingIntervals, 11, 14); // -> [[11, 14]]
 * invertedIntervalIntersections(existingIntervals, 6, 9); // -> []
 * invertedIntervalIntersections(existingIntervals, 0, 30); // -> [[0, 5], [10, 15], [20, 30]] 
 */
function invertedIntervalIntersections(
  existingIntervals: [number, number][],
  start: number,
  end: number
): [number, number][] {
  if (existingIntervals.length === 0) {
    return [[start, end]];
  }
 

  const uncachedIntervals: [number, number][] = [];
  for (let i = 0; i < existingIntervals.length; i++) {
    const interval = existingIntervals[i];
    if (start < interval[0]) {
      if (i === 0) {
        uncachedIntervals.push([start, Math.min(interval[0], end)]);
      } else {
        const lastInterval = existingIntervals[i - 1];
        uncachedIntervals.push([
          Math.max(lastInterval[1], start),
          Math.min(interval[0], end),
        ]);
      }
    }

    if (end <= interval[1]) {
      return uncachedIntervals;
    }
  }

  // add interval from last existing point to {end}
  uncachedIntervals.push([
    Math.max(existingIntervals[existingIntervals.length - 1][1], start),
    end,
  ]);
  return uncachedIntervals;
}

export { inject, injectInterval, invertedIntervalIntersections };
