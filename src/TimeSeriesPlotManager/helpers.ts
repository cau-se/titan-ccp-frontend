import { DataPoint } from './DataPoint'

/** Returns a new array containing the new DataPoints injected into the existing ones.
* Pure function.
* 
* @param existingDataPoints - this.dataPoints.
* @param toInject - The DataPoints to inject into the existing dataPoints.
*/
function inject(existingDataPoints: [Date, number][], toInject: Array<DataPoint>): [Date, number][] {
  let existingCounter = 0;
  let injectCounter = 0;

  const resultArray = [];
  while (existingCounter < existingDataPoints.length || injectCounter < toInject.length) {
    const existingDate: Date | number = existingCounter < existingDataPoints.length? existingDataPoints[existingCounter][0]: Infinity;
    const injectDate: Date | number = injectCounter < toInject.length ? toInject[injectCounter].toArray()[0] : Infinity;

    if (existingDate < injectDate) {
      resultArray.push(existingDataPoints[existingCounter]);
      existingCounter++;
    } else {
      resultArray.push(toInject[injectCounter].toArray());
      injectCounter++;
    }
  }
  return resultArray
}

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

export { inject, injectInterval }
