/**
 * Created by tom on 26/12/14.
 */

var App = Class.extend({
	init: function() {
		this.algorithm = null;
		this.viewer = new SimulationViewer("canvas");
	},
	setAlgorithm: function(algo) {
		this.algorithm = algo;
	},
	setDimensions: function(x, y) {
		this.algorithm.setDimensions(x, y);
	},
	doSimulation: function (dimensions, boxes, duration, autoPlay) {
		if (autoPlay === undefined) autoPlay = true;
		this.viewer.loadBoxes(boxes);
		this.viewer.setDuration(duration);
		//var algorithm = new SortBinPacking(dimensions.width, dimensions.height, new HeightSorter());
		console.log("Computing result...");
		var result = this.algorithm.apply(boxes);
		console.log("Solution found!");

		this.viewer.loadResult(result);

		if (autoPlay) this.viewer.doMoveBoxes();
	},
	doRandomSimulation: function(_width, _height, _boxes, _boxesCount, _duration, autoPlay) {
		var dimensions = {
			width: _width,
			height: _height
		};
		var boxesCount = _boxesCount;

		var boxes = _boxes;
		for (var i = 0; i < boxesCount; ++i) {
			var randX = Math.ceil(Math.random() * dimensions.width), randY = Math.ceil(Math.random() * dimensions.height);
			var r = Math.ceil(Math.random() * 255), g = Math.ceil(Math.random() * 255), b = Math.ceil(Math.random() * 255);
			boxes.push({
				width: randX,
				height: randY,
				color: 'rgb(' + r + ',' + g + ',' + b + ')'
			});
		}
		this.doSimulation(dimensions, boxes, _duration, autoPlay);
	}
});