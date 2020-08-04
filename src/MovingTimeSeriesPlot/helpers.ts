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

export { inject }
