//eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { CanvasTimeSeriesPlot } from '../canvasPlot/CanvasTimeSeriesPlot';
import { DataPoint } from './DataPoint'
import { MultiResolutionData } from './DataSet'
declare const d3version3: any; //eslint-disable-line @typescript-eslint/no-explicit-any


//@typescript-eslint/ban-ts-ignore

class Domain {
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



export class MovingTimeSeriesPlot {

	private width: number
	private height: number
	private yAxisLabel: string
	private datasetId: string
	private color: string
	private plotStartsWithZero: boolean
	private defaultTimeSpan: number
	private defaultStartTime: Date
	private defaultYDomain: Array<number> // [start, end]
	private yDomainEnlargement: number // in % for both top and bottom
	private dataPoints: [Date, number][]
	private plot: CanvasTimeSeriesPlot | undefined
	private onZoom: Function;

	private readonly data: MultiResolutionData;

	constructor(domContainer: HTMLElement,
		config?: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
		config = config || {};
		this.width = config.width || domContainer.clientWidth; // in px
		this.height = config.height || domContainer.clientHeight; // in px
		this.yAxisLabel = config.yAxisLabel || "Measurement";
		this.datasetId = config.datasetId || "measurement";
		this.color = config.color || "orange";
		this.plotStartsWithZero = config.plotStartsWithZero || false;
		this.defaultTimeSpan = config.defaultTimeSpan || 60 * 1000; // one minute
		this.defaultStartTime = config.defaultStartTime || new Date();
		this.defaultYDomain = config.defaultYDomain || [0, 1];
		this.yDomainEnlargement = config.yDomainEnlargement || 0.1;
		this.onZoom = config.onZoom;
		this.data = new MultiResolutionData(config.numberOfResolutionLevels || 1);

		this.dataPoints = [];
		this.plot = new CanvasTimeSeriesPlot(d3version3.select(domContainer), [this.width, this.height], {
			yAxisLabel: this.yAxisLabel,
			disableLegend: true,
			//plotMargins: { top: 20, right: 20, bottom: 30, left: this.yAxisSpacing },
			//updateViewCallback: (this.setViews).bind(this)
			onZoom: this.onZoom
		});
		if (!this.plot) return;
		this.plot.setZoomYAxis(false);
		this.plot.updateDomains([this.defaultStartTime.getTime() - this.defaultTimeSpan, this.defaultStartTime], this.defaultYDomain, false);
	}

	/**
	 * Removes the old dataset from the plot and adds the specified DataPoints as a new dataset.
	 * 
	 * @param dataPoints - The array of dataPoints to show in the plot.
	 * @param updateDomains - Whether to set the x-Domain to contain the new DataPoints.
	 */
	public setDataPoints(dataPoints: Array<DataPoint>, updateDomains: boolean): void {
		this.dataPoints = [];
		for (const dataPoint of dataPoints) {
			this.dataPoints.push(dataPoint.toArray());
		}
		if (!this.plot) return
		this.plot.removeDataSet(this.datasetId);
		this.plot.addDataSet(this.datasetId, "", this.dataPoints, this.color, false, false);
		if (updateDomains && this.dataPoints.length != 0) {
			this.plot.updateDomains(this.plot.calculateXDomain(), this.plot.getYDomain(), true);
			this.updateDomains();
		}
	}

	/**
	 * Appends DataPoints to the plot.
	 * But only if their timestamp is larger than the ones already in the plot.
	 * 
	 * @param dataPoints - The array of DataPoints to add to the end of the plot.
	 */
	public appendDataPoints(dataPoints: Array<DataPoint>): void {
		if (!this.plot) return;
		const beforeCalculatedXDomain = Domain.of(this.plot.calculateXDomain());
		const beforeActualXDomain = Domain.of(this.plot.getXDomain());
		const beforeEmpty = (this.dataPoints.length == 0);
		for (const dataPoint of dataPoints) {
			// Updates also this.dataPoints
			this.plot.addDataPoint(this.datasetId, dataPoint.toArray(), false, false);
		}
		const afterCalculatedXDomain = Domain.of(this.plot.calculateXDomain());
		const afterActualXDomain = Domain.of(this.plot.getXDomain());
		if (beforeEmpty) {
			let xDomain: Domain;
			if (afterCalculatedXDomain.getLength() < this.defaultTimeSpan) {
				xDomain = new Domain(afterCalculatedXDomain.start, afterCalculatedXDomain.start + this.defaultTimeSpan);
			}
			else {
				xDomain = new Domain(afterCalculatedXDomain.end - this.defaultTimeSpan, afterCalculatedXDomain.end);
			}
			this.plot.updateDomains(xDomain.toArray(), this.plot.getYDomain(), false);
		} else {
			if (beforeCalculatedXDomain.end <= beforeActualXDomain.end && afterCalculatedXDomain.end > afterActualXDomain.end) {
				const shifting = afterCalculatedXDomain.end - beforeCalculatedXDomain.end;
				//TODO rework this
				const xDomain = new Domain(afterActualXDomain.start * 1 + shifting, afterActualXDomain.end * 1 + shifting);
				this.plot.updateDomains(xDomain.toDateArray(), this.plot.getYDomain(), false);
			}
		}
		this.updateDomains();
	}

	/**
	 * 
	 * @param dataPointsToInject - 	The array of DataPoints to inject into the dataset. 
	 * 	This array has to be ordered by its timestamps!
	 */
	public injectDataPoints(dataPointsToInject: Array<DataPoint>, resolutionLevel: number): void {
		// inject new dataPoints into existing ones
		this.data.injectDataPoints(resolutionLevel, dataPointsToInject);
		this.dataPoints = this.data.getDataPoints(resolutionLevel);

		// apply new dataPoints to CanvasPlot
		if (!this.plot) return
		this.plot.removeDataSet(this.datasetId);
		this.plot.addDataSet(this.datasetId, "", this.data.getDataPoints(resolutionLevel), this.color, false, false);

		// recalculate domains
		this.updateDomains()
	}

	public destroy(): void {
		if (this.plot) {
			this.plot.destroy();
		}
	}

	public getData(): MultiResolutionData{
		return this.data;
	}
	
	private updateDomains(): void {
		if (!this.plot) return;
		const yDomain = Domain.of(this.plot.calculateYDomain());
		const enlargement = yDomain.getLength() * this.yDomainEnlargement
		yDomain.start -= enlargement
		yDomain.end += enlargement
		if (this.plotStartsWithZero) {
			yDomain.start = 0;
		}
		this.plot.updateDomains(this.plot.getXDomain(), yDomain.toArray(), false);
	}

}
