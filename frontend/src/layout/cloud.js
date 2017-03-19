import * as d3 from 'd3';
import cloud from 'd3-cloud';
// import cloud from './forcecloud.js';
// console.log(d3);
// var cloud = require('./d3.cloud.js');
// console.log('haha');

export class WordCloud{
  constructor(selector, radiusX = 100, radiusY = radiusX) {
    this.selector = selector;
    this.bggroup = this.selector.append('g');
    this.bg = this.bggroup.append('ellipse')
      .attr('fill-opacity', 0.0)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('rx', radiusX)
      .attr('ry', radiusY);
    this.group = this.bggroup.append('g');
    this.radiusX = radiusX;
    this.radiusY = radiusY;
    this._data = [];
    this.cloud = null;  // the handle to all the texts
    this.font = 'Impact';
    this.offset = null;
    this.rotateDegree = 0;
    this.margin_ = 0;
    this.scale = null;
    this.colorScheme = d3.scaleOrdinal(d3.schemeCategory10);
    this.bounding();
  }
  get width() {
    return (this.radiusX - this.margin_) * 2;
  }
  get height() {
    return (this.radiusY - this.margin_) * 2;
  }
  get polygon() {
    let polygon = [];
    const len = 4;
    for (let i = 0; i < len; i++){
      polygon.push([
        Math.round(this.radiusX * Math.cos(2 * Math.PI * i / len)),
        Math.round(this.radiusY * Math.sin(2 * Math.PI * i / len))]);
    }
    return polygon;
  }
  // set the relative translation regarding its mother element
  translate(x, y) {
    this.offset = [x, y];
    this.transform();
    return this;
  }

  get ellipse() {
    return this.bg;
  }

  rotate(degree) {
    this.rotateDegree = degree;
    this.transform();
    return this;
  }
  // set the background color and opacity
  background(color, alpha = 1.0) {
    this.bg
      .attr('fill', color)
      .attr('fill-opacity', alpha);
    return this;
  }
  bounding(parameters = [['stroke', this.colorScheme(0)], ['stroke-dasharray', '3,3'], ['stroke-width', '1px']]) {
    parameters.forEach((parameter) => {
      this.bg.attr(parameter[0], parameter[1]);
    });
    return this;
  }
  scale(scaleX, scaleY) {
    this.scale = {x: scaleX, y: scaleY};
    this.transform();
    return this;
  }
  margin(margin) {
    this.margin_ = margin;
    // this.group.attr('transform', `scale()`)
    return this;
  }
  // perform the transform rendering, will be called by `draw()`
  transform() {
    const translate = this.offset ? `translate(${this.offset[0]}, ${this.offset[1]})` : '';
    const rotate = this.rotateDegree ? `rotate(${this.rotateDegree}, 0, 0)` : '';
    const scale = this.scaleRatio ? `scale(${this.scale.x}, ${this.scale.y})` : '';
    const transform = scale + rotate + translate;
    if (transform)
      this.bggroup.attr('transform', transform);
    return this;
  }
  fontFamily(font) {
    this.font = font;
    return this;
  }
  color(colorScheme) {
    this.colorScheme = colorScheme;
  }
  draw(data, bounds) {
    // console.log(this.cloud);

    const self = this;
    this.cloud = this.group.selectAll('g text')
      .data(data, function (d) { return d.text; }); // matching key
    // console.log(data);
    //Entering words
    const text = this.cloud.enter()
      .append('text')
      .style('font-family', this.font)
      .style('fill', (d, i) => { return self.colorScheme(d.type); })
      .attr('text-anchor', 'middle')
      // .attr('font-size', 1);
    text
      .text(function (d) { return d.text; });


    text
      .attr('font-size', 1)
      .transition()
      .duration(600)
      .style('font-size', function (d) { return d.size + 'px'; })
      .attr('transform', function (d) {
        return 'translate(' + [d.x, d.y] + ')';
      })
      .style('fill-opacity', 1);;

    //Exiting words
    this.cloud.exit()
      .transition()
      .duration(200)
      .style('fill-opacity', 1e-6)
      .attr('font-size', 1)
      .remove();

    this._txt = null;
    // autoscale
    // setTimeout(() => self.autoscale(bounds), 100);
  }
  ticked(data) {
    // console.log('ticked');
    if (this._txt) {
      this._txt
        .attr('transform', function (d) {
          return 'translate(' + [d.x, d.y] + ')';
        })
    } else {
      const self = this;
      this.group.selectAll('g, text').remove();
      this._txt = this.group.selectAll('g text')
        .data(data, function (d) { return d.text; }) // matching key
        .enter()
        .append('text')
        .text(function (d) { return d.text; })
        .style('font-family', this.font)
        .style('fill', (d, i) => { return self.colorScheme(d.type); })
        .style('font-size', function (d) { return ~~(d.size) + 'px'; })
        .attr('transform', function (d) {
          return 'translate(' + [d.x, d.y] + ')';
        })
        .style('fill-opacity', 1);
    }
  }
  update(words) {
    const self = this;

    words.sort((a, b) => {return a.size - b.size; });
    const scale = d3.scalePow()
      .range([this.width / 30, this.width / 10])
      .domain(d3.extent(words, (d) => d.size));
    // d3.cloud()
    cloud()
      .size([this.width, this.height])
      // .canvas(() => { return document.createElement("canvas"); })
      .words(words)
      .padding(1)
      .rotate(0)
      // .polygon(this.polygon)
      // .d(0.3)
      .font(this.font)
      .text(d => d.text)
      .fontSize(d => scale(d.size))
      .on('end', (words, bounds) => self.draw(words, bounds))
      .start();
    // return this
  }
  autoscale(bounds) {

    // console.log(`centerx: ${centerX}, centerY: ${centerY}`);
    const scaleX = 0.9 * this.width / Math.abs(bounds[0].x - bounds[1].x);
    const scaleY = 0.9 * this.height / Math.abs(bounds[0].y - bounds[1].y);
    const scale = Math.min(scaleX, scaleY);
    const centerX = (bounds[1].x + bounds[0].x - this.width) / 2 * scale;
    const centerY = (bounds[1].y + bounds[0].y - this.height) / 2 * scale;
    this.group.attr('transform', `scale(${scale}) translate(${-centerX}, ${-centerY})`);
  }
}

export default {
  WordCloud,
};