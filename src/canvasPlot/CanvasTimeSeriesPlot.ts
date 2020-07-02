import { CanvasDataPlot } from './CanvasDataPlot'
declare let d3: any;

class CanvasTimeSeriesPlot extends CanvasDataPlot {
  private informationDensity: number[];
  private plotLineWidth: number;
  private showMarkerDensity: number;
  private maxInformationDensity: number;

  public constructor(parentElement: HTMLElement, canvasDimensions: [number, number], config: any) {
    super(parentElement, canvasDimensions, config);
    config = config || {};
    this.informationDensity = []

    this.plotLineWidth = config.plotLineWidth || 1;
    this.maxInformationDensity = config.maxInformationDensity || 2.0;
    this.showMarkerDensity = config.showMarkerDensity || 0.14;

    CanvasDataPlot.call(this, parentElement, canvasDimensions, config);
  }

  public addDataSet(uniqueID: string, label: string, dataSet: [], colorString: string, updateDomains: boolean, copyData: boolean) {
    this.informationDensity.push(1);
    CanvasDataPlot.prototype.addDataSet.call(this, uniqueID, label, dataSet, colorString, updateDomains, copyData);
  }

  public removeDataSet(uniqueID: string) {
    const index = this.dataIDs.indexOf(uniqueID);
    if (index >= 0) {
      this.informationDensity.splice(index, 1);
    }
    CanvasDataPlot.prototype.removeDataSet.call(this, uniqueID);
  }

  updateDisplayIndices() {
    super.updateDisplayIndices.call(this);

    const nDataSets = this.data.length;
    for (let i = 0; i < nDataSets; ++i) {
      const d = this.data[i];
      if (d.length < 1) {
        continue;
      }
      const iStart = this.displayIndexStart[i];
      const iEnd = this.displayIndexEnd[i];
      const iLength = iEnd - iStart + 1;
      const scaleLength = Math.max(1, this.xScale(d[iEnd][0]) - this.xScale(d[iStart][0]));
      this.informationDensity[i] = iLength / scaleLength;
    }
  }

  updateTooltip() {
    const mouse = d3.mouse(this.div.node());
    const mx = mouse[0] - this.margin.left;
    const my = mouse[1] - this.margin.top;
    if (mx <= 0 || mx >= this.width || my <= 0 || my >= this.height) {
      this.removeTooltip();
      return;
    }

    const nDataSets = this.data.length;
    let hitMarker = false;
    // eslint-disable-next-line @typescript-eslint/camelcase
    TimeSeriesPlot_updateTooltip_graph_loop:
    for (let i = 0; i < nDataSets; ++i) {
      if (this.informationDensity[i] > this.showMarkerDensity) {
        continue;
      }
      const d = this.data[i];
      const iStart = this.displayIndexStart[i];
      const iEnd = Math.min(d.length - 1, this.displayIndexEnd[i] + 1);
      for (let j = iStart; j <= iEnd; ++j) {
        const dx = this.xScale(d[j][0]) - mx;
        const dy = this.yScale(d[j][1]) - my;
        if (dx * dx + dy * dy <= this.tooltipRadiusSquared) {
          hitMarker = true;
          this.showTooltip([this.xScale(d[j][0]), this.yScale(d[j][1])], this.dataColors[i], this.getTooltipStringX(d[j]), this.getTooltipStringY(d[j]));
          // eslint-disable-next-line @typescript-eslint/camelcase
          break TimeSeriesPlot_updateTooltip_graph_loop;
        }
      }
    }
    if (!hitMarker) {
      this.removeTooltip();
    }
  }

  getTooltipStringX(dataPoint: [Date, number]) {
    const zeroPad2 = function (n: number) {
      return n < 10 ? ("0" + n) : n.toString();
    };
    const date = dataPoint[0];
    const Y = date.getUTCFullYear();
    const M = zeroPad2(date.getUTCMonth());
    const D = zeroPad2(date.getUTCDay());
    const h = zeroPad2(date.getUTCHours());
    const m = zeroPad2(date.getUTCMinutes());
    const s = zeroPad2(date.getUTCSeconds());
    return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s;
  }

  private setupXScaleAndAxis(): void {
    this.xScale = d3.time.scale.utc()
      .domain(this.calculateXDomain())
      .range([0, this.width])
      .nice();

    const customTimeFormat = d3.time.format.utc.multi([
      [".%L", function (d: Date) { return d.getUTCMilliseconds(); }],
      [":%S", function (d: Date) { return d.getUTCSeconds(); }],
      //["%I:%M", function(d: Date) { return d.getUTCMinutes(); }],
      ["%H:%M", function (d: Date) { return d.getUTCHours() + d.getUTCMinutes(); }],
      //["%a %d", function(d: Date) { return d.getUTCDay() && d.getUTCDate() != 1; }],
      ["%b %d", function (d: Date) { return d.getUTCDate() != 1; }],
      ["%B '%y", function (d: Date) { return d.getUTCMonth(); }],
      ["%Y", function () { return true; }]
    ]);

    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      .orient("bottom")
      .tickFormat(customTimeFormat)
      .ticks(Math.round(this.xTicksPerPixel * this.width));
  }

  drawDataSet(dataIndex: number) {
    const d = this.data[dataIndex];
    if (d.length < 1) {
      return;
    }
    let iStart = this.displayIndexStart[dataIndex];
    const iEnd = this.displayIndexEnd[dataIndex];
    const informationDensity = this.informationDensity[dataIndex];

    let drawEvery = 1;
    if (informationDensity > this.maxInformationDensity) {
      drawEvery = Math.floor(informationDensity / this.maxInformationDensity);
    }

    // Make iStart divisivble by drawEvery to prevent flickering graphs while panning
    iStart = Math.max(0, iStart - iStart % drawEvery);

    this.canvas.beginPath();
    this.canvas.moveTo(this.xScale(d[iStart][0]), this.yScale(d[iStart][1]));
    for (let i = iStart; i <= iEnd; i = i + drawEvery) {
      this.canvas.lineTo(this.xScale(d[i][0]),
        this.yScale(d[i][1]));
    }
    const iLast = Math.min(d.length - 1, iEnd + drawEvery);
    this.canvas.lineTo(this.xScale(d[iLast][0]),
      this.yScale(d[iLast][1]));
    this.canvas.lineWidth = this.plotLineWidth;
    this.canvas.strokeStyle = this.dataColors[dataIndex];
    this.canvas.stroke();

    if (informationDensity <= this.showMarkerDensity) {
      this.canvas.lineWidth = this.markerLineWidth;
      for (let i = iStart; i <= iLast; ++i) {
        this.canvas.beginPath();
        this.canvas.arc(this.xScale(d[i][0]), this.yScale(d[i][1]),
          this.markerRadius, 0, 2 * Math.PI);
        this.canvas.stroke();
      }
    }
  }
}

export { CanvasTimeSeriesPlot }
