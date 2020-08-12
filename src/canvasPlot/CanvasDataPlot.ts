// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let d3version3: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d3: any = d3version3;

export type d3Point = [Date, number];

class CanvasDataPlot {
  protected data: d3Point[][];
  dataIDs: string[];
  dataLabels: string[];
  displayIndexStart: number[];
  displayIndexEnd: number[];
  dataColors: string[];
  xAxisLabelText: string;
  yAxisLabelText: string;
  updateViewCallback: Function;
  parent: HTMLElement;

  disableLegend: boolean
  invertYAxis: boolean;
  gridColor: string;
  markerLineWidth: number;
  markerRadius: number;
  xTicksPerPixel: number;
  yTicksPerPixel: number;
  minCanvasWidth: number;
  minCanvasHeight: number;
  legendMargin: number;
  legendXPadding: number;
  legendYPadding: number;
  legendLineHeight: number;
  margin: any;
  showTooltips: boolean;
  tooltipRadiusSquared: number;

  totalWidth: number;
  totalHeight: number;
  width: number;
  height: number;
  div: any;
  d3Canvas: any;
  canvas: any;
  svg: any;
  svgTranslateGroup: any;
  xScale: any;
  yScale: any;
  xAxis: any;
  yAxis: any;
  yAxisGroup: any;
  xAxisGroup: any;
  xAxisLabel: any;
  yAxisLabel: any;
  legend: any;
  tooltip: any;
  legendBG: any;
  zoomListener: any;
  legendWidth: number;
  xAxisZoom: boolean;
  yAxisZoom: boolean;
  onZoom: Function;

  public constructor(parentElement: HTMLElement, canvasDimensions: Array<number>, config: any) {
    config = config || {};

    this.data = []; // (default implementation: [dataSet][dataPoint][[0: x, 1: y]], ordered ascendingly by x value)
    this.dataIDs = [];
    this.dataLabels = [];
    this.displayIndexStart = [];
    this.displayIndexEnd = [];
    this.dataColors = [];
    this.xAxisLabelText = config.xAxisLabel || "";
    this.yAxisLabelText = config.yAxisLabel || "";
    this.updateViewCallback = config.updateViewCallback || null;
    this.parent = parentElement;

    this.disableLegend = config.disableLegend || false;
    this.invertYAxis = config.invertYAxis || false;
    this.gridColor = config.gridColor || "#DFDFDF";
    this.markerLineWidth = config.markerLineWidth || 1;
    this.markerRadius = config.markerRadius || 3.0;
    this.xTicksPerPixel = config.xTicksPerPixel || 1.0 / 92.0;
    this.yTicksPerPixel = config.yTicksPerPixel || 1.0 / 40.0;
    this.minCanvasWidth = config.minCanvasWidth || 250;
    this.minCanvasHeight = config.minCanvasHeight || 150;
    this.legendMargin = config.legendMargin || 10;
    this.legendXPadding = config.legendXPadding || 5;
    this.legendYPadding = config.legendYPadding || 6;
    this.legendLineHeight = config.legendLineHeight || 11;
    this.margin = config.plotMargins || { top: 20, right: 20, bottom: (this.xAxisLabelText.length > 0 ? 60 : 30), left: (this.yAxisLabelText.length > 0 ? 65 : 50) };
    this.showTooltips = (config.showTooltips == false ? false : true);
    this.tooltipRadiusSquared = config.tooltipRadius || 5.5;
    this.tooltipRadiusSquared *= this.tooltipRadiusSquared;
    //this.enableValueSelection = config.enableValueSelection || false;

    this.totalWidth = Math.max(this.minCanvasWidth, canvasDimensions[0]);
    this.totalHeight = Math.max(this.minCanvasHeight, canvasDimensions[1]);
    this.width = this.totalWidth - this.margin.left - this.margin.right;
    this.height = this.totalHeight - this.margin.top - this.margin.bottom;

    this.div = this.parent.append("div");
    this.div.attr("class", "cvpChart")
      .style("width", this.totalWidth + "px")
      .style("height", this.totalHeight + "px");
    this.d3Canvas = this.div.append("canvas")
      .attr("class", "cvpCanvas")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("padding", this.margin.top + "px " + this.margin.right + "px " + this.margin.bottom + "px " + this.margin.left + "px");
    this.canvas = this.d3Canvas.node().getContext("2d");
    this.svg = this.div.append("svg")
      .attr("class", "cvpSVG")
      .attr("width", this.totalWidth)
      .attr("height", this.totalHeight);
    this.svgTranslateGroup = this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale = null;
    this.yScale = null;
    this.xAxis = null;
    this.yAxis = null;
    this.setupXScaleAndAxis();
    this.setupYScaleAndAxis();

    this.yAxisGroup = this.svgTranslateGroup.append("g")
      .attr("class", "y cvpAxis")
      .call(this.yAxis);
    this.xAxisGroup = this.svgTranslateGroup.append("g")
      .attr("class", "x cvpAxis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);

    this.xAxisLabel = null;
    this.yAxisLabel = null;
    if (this.xAxisLabelText.length > 0) {
      this.xAxisLabel = this.svgTranslateGroup.append("text")
        .attr("class", "cvpLabel")
        .attr("x", Math.round(0.5 * this.width))
        .attr("y", this.height + 40)
        .attr("text-anchor", "middle")
        .text(this.xAxisLabelText);
    }
    if (this.yAxisLabelText.length > 0) {
      this.yAxisLabel = this.svg.append("text")
        .attr("class", "cvpLabel")
        .attr("x", Math.round(-0.5 * this.height - this.margin.top))
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text(this.yAxisLabelText);
    }
    this.tooltip = null;
    this.legend = null;
    this.legendBG = null;
    this.legendWidth = 0;

    //this.updateDisplayIndices();
    this.drawCanvas();

    this.onZoom = config.onZoom;
    this.zoomListener = d3.behavior.zoom()
      .on("zoom", ((): void => {
        //console.log("Zoom: " + d3.event.scale + ", x=" + d3.event.translate[0] + ", y="+d3.event.translate[1]);
        if (this.updateViewCallback) {
          this.updateViewCallback(this, this.xScale.domain(), this.yScale.domain());
        }
        this.updateDisplayIndices();
        this.redrawCanvasAndAxes();
        if (this.showTooltips) {
          this.updateTooltip();
        }
        if (this.onZoom) {
          this.onZoom(this.getXDomain(), this.getYDomain(), d3.event.scale)
        }
      }).bind(this));
    this.zoomListener(this.div);

    if (this.showTooltips) {
      this.div.on("mousemove", (this.updateTooltip).bind(this));
    }

    this.xAxisZoom = true;
    this.yAxisZoom = true;
    this.resetZoomListenerAxes();
  }

  public setOnZoom(onZoom: (xDomain: any, yDomain: any, zoomFactor: number) => void): void {
    this.onZoom = onZoom;
  }

  addDataSet(uniqueID: string, label: string, dataSet: Array<any>, colorString: string, updateDomains: boolean, copyData: boolean): void {
    this.dataIDs.push(uniqueID);
    this.dataLabels.push(label);
    this.dataColors.push(colorString);
    this.displayIndexStart.push(0);
    this.displayIndexEnd.push(0);
    dataSet = dataSet || [];
    if (copyData) {
      const dataIndex = this.data.length;
      this.data.push([]);
      const dataSetLength = dataSet.length;
      for (let i = 0; i < dataSetLength; ++i) {
        this.data[dataIndex].push(dataSet[i].slice(0));
      }
    }
    else {
      this.data.push(dataSet);
    }

    this.updateLegend();

    if (updateDomains) {
      this.updateDomains(this.calculateXDomain(), this.calculateYDomain(), true);
    }
    else {
      this.updateDisplayIndices();
      this.drawCanvas();
    }
  }

  addDataPoint(uniqueID: string, dataPoint: d3Point, updateDomains: boolean, copyData: boolean): void {
    const i = this.dataIDs.indexOf(uniqueID);
    if (i < 0 || (this.data[i].length > 0 && this.data[i][this.data[i].length - 1][0] > dataPoint[0])) {
      return;
    }
    this.data[i].push(copyData ? [...dataPoint] : dataPoint);

    if (updateDomains) {
      this.updateDomains(this.calculateXDomain(), this.calculateYDomain(), true);
    }
    else {
      this.updateDisplayIndices();
      this.drawCanvas();
    }
  }

  removeDataSet(uniqueID: string): void {
    const index = this.dataIDs.indexOf(uniqueID);
    if (index >= 0) {
      this.data.splice(index, 1);
      this.dataIDs.splice(index, 1);
      this.dataLabels.splice(index, 1);
      this.displayIndexStart.splice(index, 1);
      this.displayIndexEnd.splice(index, 1);
      this.dataColors.splice(index, 1);

      this.updateLegend();
      this.drawCanvas();
    }
  }

  setZoomXAxis(zoomX: boolean): void {
    if (this.xAxisZoom == zoomX) {
      return;
    }
    this.xAxisZoom = zoomX;
    this.resetZoomListenerAxes();
  }

  setZoomYAxis(zoomY: boolean): void {
    if (this.yAxisZoom == zoomY) {
      return;
    }
    this.yAxisZoom = zoomY;
    this.resetZoomListenerAxes();
  }

  resize(dimensions: Array<number>): void {
    this.totalWidth = Math.max(this.minCanvasWidth, dimensions[0]);
    this.totalHeight = Math.max(this.minCanvasHeight, dimensions[1]);
    this.width = this.totalWidth - this.margin.left - this.margin.right;
    this.height = this.totalHeight - this.margin.top - this.margin.bottom;
    this.div.style("width", this.totalWidth + "px")
      .style("height", this.totalHeight + "px");
    this.d3Canvas.attr("width", this.width)
      .attr("height", this.height);
    this.svg.attr("width", this.totalWidth)
      .attr("height", this.totalHeight);

    this.xScale.range([0, this.width]);
    this.yScale.range([this.height, 0]);
    this.xAxis
      .ticks(Math.round(this.xTicksPerPixel * this.width));
    this.yAxis
      .ticks(Math.round(this.yTicksPerPixel * this.height));
    this.xAxisGroup
      .attr("transform", "translate(0," + this.height + ")");
    if (this.xAxisLabel) {
      this.xAxisLabel
        .attr("x", Math.round(0.5 * this.width))
        .attr("y", this.height + 40);
    }
    if (this.yAxisLabel) {
      this.yAxisLabel
        .attr("x", Math.round(-0.5 * this.height - this.margin.top));
    }
    if (this.legend) {
      this.legend
        .attr("transform", "translate(" + (this.width - this.legendWidth - this.legendMargin) + ", " + this.legendMargin + ")");
    }

    this.updateDisplayIndices();
    this.resetZoomListenerAxes();
    this.redrawCanvasAndAxes();
  }

  updateDomains(xDomain: any[], yDomain: Array<number>, makeItNice: boolean): void {
    this.xScale.domain(xDomain);
    this.yScale.domain(yDomain);
    if (makeItNice) {
      this.xScale.nice();
      this.yScale.nice();
    }

    this.updateDisplayIndices();
    this.resetZoomListenerAxes();
    this.redrawCanvasAndAxes();
  }

  public getXDomain() {
    return this.xScale.domain();
  }

  public getYDomain() {
    return this.yScale.domain();
  }

  calculateXDomain(): [number, number] {
    const nonEmptySets: d3Point[][] = [];
    this.data.forEach((ds: d3Point[]) => {
      if (ds && ds.length > 0) {
        nonEmptySets.push(ds);
      }
    });

    if (nonEmptySets.length < 1) {
      return [0, 1];
    }

    let min = nonEmptySets[0][0][0].getTime();
    let max: number = nonEmptySets[0][nonEmptySets[0].length - 1][0].getTime();
    for (let i = 1; i < nonEmptySets.length; ++i) {
      const minCandidate = nonEmptySets[i][0][0].getTime();
      const maxCandidate = nonEmptySets[i][nonEmptySets[i].length - 1][0].getTime();
      min = minCandidate < min ? minCandidate : min;
      max = max < maxCandidate ? maxCandidate : max;
    }
    if (max - min <= 0) {
      min = 1 * max; //NOTE: 1* is neceseccary to handle Dates in derived classes.
      max = min + 1;
    }
    return [min, max];
  }

  calculateYDomain(): [number, number] {
    const nonEmptySets: d3Point[][] = [];
    this.data.forEach(function (ds: d3Point[]) {
      if (ds && ds.length > 0) {
        nonEmptySets.push(ds);
      }
    });

    if (nonEmptySets.length < 1) {
      return [0, 1];
    }

    let min = d3.min(nonEmptySets[0], function (d: number[]) { return d[1]; });
    let max = d3.max(nonEmptySets[0], function (d: number[]) { return d[1]; });
    for (let i = 1; i < nonEmptySets.length; ++i) {
      min = Math.min(min, d3.min(nonEmptySets[i], function (d: number[]) { return d[1]; }));
      max = Math.max(max, d3.max(nonEmptySets[i], function (d: number[]) { return d[1]; }));
    }
    if (max - min <= 0) {
      min = max - 1;
      max += 1;
    }
    return [min, max];
  }

  destroy(): void {
    this.div.remove();
  }

  // private methods

  protected setupXScaleAndAxis(): void {
    this.xScale = d3.scale.linear()
      .domain(this.calculateXDomain())
      .range([0, this.width])
      .nice();

    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      .orient("bottom")
      .ticks(Math.round(this.xTicksPerPixel * this.width));
  }

  private setupYScaleAndAxis(): void {
    this.yScale = d3.scale.linear()
      .domain(this.calculateYDomain())
      .range(this.invertYAxis ? [0, this.height] : [this.height, 0])
      .nice();

    this.yAxis = d3.svg.axis()
      .scale(this.yScale)
      .orient("left")
      .ticks(Math.round(this.yTicksPerPixel * this.height));
  }

  private getDataID(index: number): string {
    return (this.dataIDs.length > index ? this.dataIDs[index] : "");
  }

  protected updateTooltip(): void {
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
    CanvasDataPlot_updateTooltip_graph_loop:
    for (let i = 0; i < nDataSets; ++i) {
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
          break CanvasDataPlot_updateTooltip_graph_loop;
        }
      }
    }
    if (!hitMarker) {
      this.removeTooltip();
    }
  }

  protected getTooltipStringX(dataPoint: d3Point): string {
    return "x = " + dataPoint[0];
  }

  protected getTooltipStringY(dataPoint: d3Point): string {
    return "y = " + dataPoint[1];
  }

  protected showTooltip(position: [number, number], color: string, xText: string, yText: string): void {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }

    this.tooltip = this.svgTranslateGroup.append("g")
      .attr("class", "cvpTooltip")
      .attr("transform", "translate(" + position[0] + ", " + (position[1] - this.markerRadius - 2) + ")");
    const tooltipBG = this.tooltip.append("path")
      .attr("class", "cvpTooltipBG")
      .attr("d", "M0 0 L-10 -10 L-100 -10 L-100 -45 L100 -45 L100 -10 L10 -10 Z")
      .attr("stroke", color)
      .attr("vector-effect", "non-scaling-stroke");
    const xTextElem = this.tooltip.append("text")
      .attr("x", 0)
      .attr("y", -32)
      .attr("text-anchor", "middle")
      .text(xText);
    const yTextElem = this.tooltip.append("text")
      .attr("x", 0)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .text(yText);
    tooltipBG.attr("transform", "scale(" + (1.1 * Math.max(xTextElem.node().getComputedTextLength(), yTextElem.node().getComputedTextLength()) / 200) + ",1)");
  }

  protected removeTooltip(): void {
    if (!this.tooltip) {
      return;
    }
    this.tooltip.remove();
    this.tooltip = null;
  }

  private updateLegend(): void {
    if (this.disableLegend) {
      return;
    }
    if (this.legend) {
      this.legend.remove();
      this.legend = null;
      this.legendWidth = 0;
    }
    if (this.data.length == 0) {
      return;
    }

    this.legend = this.svgTranslateGroup.append("g")
      .attr("class", "cvpLegend")
      .attr("transform", "translate(" + (this.width + this.margin.right + 1) + ", " + this.legendMargin + ")");
    this.legendBG = this.legend.append("rect")
      .attr("class", "cvpLegendBG")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 250)
      .attr("height", this.legendYPadding + this.dataLabels.length * (this.legendYPadding + this.legendLineHeight) - 1);

    let maxTextLen = 0;
    this.dataLabels.forEach(((_d: any, i: number) => {
      this.legend.append("rect")
        .attr("x", this.legendXPadding)
        .attr("y", this.legendYPadding + i * (this.legendYPadding + this.legendLineHeight))
        .attr("width", this.legendLineHeight)
        .attr("height", this.legendLineHeight)
        .attr("fill", this.dataColors[i])
        .attr("stroke", "none");
      const textElem = this.legend.append("text")
        .attr("x", 2 * this.legendXPadding + this.legendLineHeight - 1)
        .attr("y", this.legendYPadding + this.legendLineHeight + i * (this.legendYPadding + this.legendLineHeight) - 1)
        .text(this.dataLabels[i].length > 0 ? this.dataLabels[i] : this.dataIDs[i]);
      maxTextLen = Math.max(maxTextLen, textElem.node().getComputedTextLength());
    }).bind(this));
    this.legendWidth = 3 * this.legendXPadding + this.legendLineHeight + maxTextLen - 1;
    this.legendBG.attr("width", this.legendWidth);
    this.legend
      .attr("transform", "translate(" + (this.width - this.legendWidth - this.legendMargin) + ", " + this.legendMargin + ")");
  }

  private findLargestSmaller(d: d3Point[], ia: number, ib: number, v: number): number {
    if (this.xScale(d[ia][0]) >= v || ib - ia <= 1) {
      return ia;
    }

    const imiddle = Math.floor(0.5 * (ia + ib));

    return this.xScale(d[imiddle][0]) <= v ? this.findLargestSmaller(d, imiddle, ib, v) : this.findLargestSmaller(d, ia, imiddle, v);
  }

  protected updateDisplayIndices(): void {
    const nDataSets = this.data.length;
    for (let i = 0; i < nDataSets; ++i) {
      const d = this.data[i];
      if (d.length < 1) {
        continue;
      }
      const iStart = this.findLargestSmaller(d, 0, d.length - 1, 0);
      const iEnd = this.findLargestSmaller(d, iStart, d.length - 1, this.width);
      this.displayIndexStart[i] = iStart;
      this.displayIndexEnd[i] = iEnd;
    }
  }


  private redrawCanvasAndAxes(): void {
    this.xAxisGroup.call(this.xAxis);
    this.yAxisGroup.call(this.yAxis);
    this.drawCanvas();
  }

  private drawCanvas(): void {
    this.canvas.clearRect(0, 0, this.width, this.height);

    this.drawGrid();

    const nDataSets = this.data.length;
    for (let i = 0; i < nDataSets; ++i) {
      this.drawDataSet(i);
    }
  }

  private drawGrid(): void {
    this.canvas.lineWidth = 1;
    this.canvas.strokeStyle = this.gridColor;
    this.canvas.beginPath();
    this.yScale.ticks(this.yAxis.ticks()[0])
      .map(((d: any) => { return Math.floor(this.yScale(d)) + 0.5; }).bind(this))
      .forEach(((d: any) => {
        this.canvas.moveTo(0, d);
        this.canvas.lineTo(this.width, d);
      }).bind(this));
    this.xScale.ticks(this.xAxis.ticks()[0])
      .map(((d: any) => { return Math.floor(this.xScale(d)) + 0.5; }).bind(this))
      .forEach(((d: any) => {
        this.canvas.moveTo(d, 0);
        this.canvas.lineTo(d, this.height);
      }).bind(this));
    this.canvas.stroke();
  }

  protected drawDataSet(dataIndex: number): void {
    const d = this.data[dataIndex];
    if (d.length < 1) {
      return;
    }
    const iStart = this.displayIndexStart[dataIndex];
    const iEnd = this.displayIndexEnd[dataIndex];
    const iLast = Math.min(d.length - 1, iEnd + 1);

    this.canvas.strokeStyle = this.dataColors[dataIndex];
    this.canvas.lineWidth = this.markerLineWidth;
    for (let i = iStart; i <= iLast; ++i) {
      this.canvas.beginPath();
      this.canvas.arc(this.xScale(d[i][0]), this.yScale(d[i][1]),
        this.markerRadius, 0, 2 * Math.PI);
      this.canvas.stroke();
    }
  }

  private resetZoomListenerAxes(): void {
    this.zoomListener
      .x(this.xAxisZoom ? this.xScale : d3.scale.linear().domain([0, 1]).range([0, 1]))
      .y(this.yAxisZoom ? this.yScale : d3.scale.linear().domain([0, 1]).range([0, 1]));
  }

  private updateZoomValues(scale: number, translate: any): void {
    this.zoomListener
      .scale(scale)
      .translate(translate);
    this.updateDisplayIndices();
    this.redrawCanvasAndAxes();
  }
}

export { CanvasDataPlot }
