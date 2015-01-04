/**
 * Created by tom on 26/12/14.
 */

var SimulationViewer = Class.extend({
	init: function (canvasID) {
		this.canvas = document.getElementById("main");
		this.ctx = this.canvas.getContext('2d');

		// Default values
		this.scale = 2.5;
		this.margin = 10;

		this.maxHeight = 0;

		this.boxes = null;
		this.grids = null;
		this.result = null;

		this.animationDuration = 400;

		this.startOfOutput = null; // rendering helper. coordinates of the output rendering anchor.
	},
	setDuration: function(_duration) {
		this.animationDuration = _duration;
	},
	loadBoxes: function (boxes) {
		var maxHeight = 0;
		// Update the boxes indexes
		for (var ci in boxes) {
			if (!boxes.hasOwnProperty(ci)) continue;
			boxes[ci].id = ci;
			boxes[ci].positionX = 0;
			boxes[ci].positionY = 0;
			boxes[ci].offsetX = 0;
			boxes[ci].offsetY = 0;
			boxes[ci].targetX = 0;
			boxes[ci].targetY = 0;

			// Let's calculate max box height
			if (boxes[ci].height > maxHeight) maxHeight = boxes[ci].height;
		}
		// Store the max height for rendering purposes
		this.maxHeight = maxHeight;
		this.rowHeight = maxHeight * this.scale;

		this.boxes = boxes;
	},
	setScale: function (scale) {
		if (this.maxHeight) this.rowHeight = this.maxHeight * scale;
		this.scale = scale;
		this.updateRenderingAnchors();
		this.draw();
	},
	animateScale: function (scale) {
		var self = this;
		$({value: this.scale}).animate({value: scale}, {
			duration: 400,
			step: function (value) {
				self.setScale(value);
			},
			complete: function () {
				self.setScale(scale);
			}
		});
	},
	/**
	 * Setup the boxes to their initial positions.
	 * Returns the starting point of the output.
	 */
	setupBoxesPositions: function () {
		// Distribute input boxes
		var x = this.margin;
		var y = this.rowHeight + this.margin;
		var i;
		for (i = 0; i < this.boxes.length; ++i) {
			var c = this.boxes[i];
			if (x + c.width * this.scale >= this.canvas.width) {
				x = this.margin;
				y += this.rowHeight + this.margin;
			}

			c.positionX = x;
			c.positionY = y - c.height * this.scale;

			// Store initial position apart from the position to draw ghost boxes.
			c.initialPositionX = x;
			c.initialPositionY = y;

			x += c.width * this.scale + this.margin;
		}

		this.canvas.height = y + this.margin;
		return {
			x: x,
			y: y
		};
	},
	/**
	 * Compute the final position of the box according to the output of the algorithm.
	 */
	setupSolutionAnimation: function () {
		// Bypass if called before result is set.
		if (! this.result) return;

		// Now, draw the grids
		var x = this.startOfOutput.x, y = this.startOfOutput.y;
		var width, height;
		var i;
		for (i in this.grids) {
			if (!this.grids.hasOwnProperty(i)) continue;
			var g = this.grids[i];

			width = g[0].length * this.scale;
			height = g.length * this.scale;

			if (x + width >= this.canvas.width) {	// Don't go over the canvas width
				x = this.margin;			// Reset X
				y += height + this.margin;	// Increase Y
			}

			// Setup the boxes positions
			var placements = this.result.placements[i];
			var pi;
			for (pi in placements) {
				if (!placements.hasOwnProperty(pi))
					continue;
				var p = placements[pi];
				var box = this.boxes[p.boxID];
				box.targetX = x + p.x * this.scale;
				box.targetY = y + p.y * this.scale;
			}

			x += width + this.margin;		// Increase X
		}

		// Increase canvas size to fit everything
		this.canvas.height = y + height + this.margin;
	},

	/**
	 * Perform an animation of a box to a target position.
	 * @param box
	 * @param targetX
	 * @param targetY
	 * @param callback
	 */
	moveBox: function (box, targetX, targetY, callback) {
		var self = this;
		$(box).animate({
			offsetX: targetX - box.positionX,
			offsetY: targetY - box.positionY
		}, {
			duration: this.animationDuration,
			step: function (box) {
				self.draw();
			},
			complete: function () {
				box.offsetX = 0;
				box.offsetY = 0;
				box.positionX = targetX;
				box.positionY = targetY;
				self.draw();
				if (callback) callback();
			}
		});
	},

	draw: function () {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Drawing input boxes
		this.ctx.strokeStyle = 'black';
		var i, c;
		for (i = 0; i < this.boxes.length; ++i) {
			c = this.boxes[i];

			this.ctx.fillStyle = c.color;
			this.ctx.beginPath();
			this.ctx.rect(
				Math.floor(c.positionX + c.offsetX),
				Math.floor(c.positionY + c.offsetY),
				Math.floor(c.width * this.scale  - this.ctx.lineWidth) + 1,
				Math.floor(c.height * this.scale - this.ctx.lineWidth) + 1
			);
			this.ctx.stroke();
			this.ctx.fill();
			this.ctx.closePath();
		}
		this.ctx.strokeStyle = 'black';
		this.drawGrid();
	},

	drawGrid: function () {
		if (!this.startOfOutput) return;
		var x = this.startOfOutput.x, y = this.startOfOutput.y;

		var i;
		this.ctx.lineWidth = 2;
		for (i in this.grids) {
			if (!this.grids.hasOwnProperty(i))
				continue;
			var g = this.grids[i];
			var width = g[0].length * this.scale, height = g.length * this.scale;
			if (x + width >= this.canvas.width) {
				x = this.margin;
				y += height + this.margin;
			}
			this.ctx.beginPath();
			this.ctx.rect(
				Math.floor(x),
				Math.floor(y),
				Math.floor(width),
				Math.floor(height)
			);
			this.ctx.stroke();

			x += width + this.margin;
		}
	},

	/**
	 * Performs the boxes animation for the solution.
	 */
	doMoveBoxes: function () {
		var self = this;
		var boxesToAnimate = [];
		var moveNextBox = function () {
			if (boxesToAnimate.length == 0)
				return;
			var box = boxesToAnimate.shift();
			self.moveBox(box, box.targetX, box.targetY, function () {
				moveNextBox()
			});
		};

		// Create a queue of boxes that has to be moved.
		var i;
		for (i in this.boxes) {
			if (!this.boxes.hasOwnProperty(i)) continue;
			boxesToAnimate.push(this.boxes[i]);
		}
		// Process the queue
		moveNextBox();
	},

	/**
	 * Loads the algorithm result and prepare solution rendering.
	 * @param result
	 */
	loadResult: function (result) {
		this.result = result;
		this.grids = result.grids;

		this.updateRenderingAnchors();
		this.draw();
	},

	/**
	 * Updates the coordinates of the anchor of output rendering
	 */
	updateRenderingAnchors: function() {
		this.startOfOutput = this.setupBoxesPositions();

		// Update the coordinate of output rendering anchor.
		this.startOfOutput.x = this.margin;
		this.startOfOutput.y += this.margin;

		this.setupSolutionAnimation();
	},

	/**
	 * Performs a simulation with a given set of boxes.
	 * For debugging purpose only.
	 */
	doSimulation: function (dimensions, boxes, autoPlay) {
		console.warn("SimulationViewer.doSimulation() should only be used for debugging purposes.");
		if (autoPlay === undefined) autoPlay = true;
		this.loadBoxes(boxes);

		var algorithm = new SortBinPacking(dimensions.width, dimensions.height, new HeightSorter());
		console.log("Computing result...");
		var result = algorithm.apply(boxes);
		console.log("Solution found!");

		this.loadResult(result);
		this.draw();

		if (autoPlay) this.doMoveBoxes();
	},
	doRandomSimulation: function (autoPlay) {
		throw "deprecated";
		console.warn("SimulationViewer.doRandomSimulation() should only be used for debugging purposes.");
		var dimensions = {
			width: 20,
			height: 20
		};
		var boxesCount = 100;

		var boxes = [];
		for (var i = 0; i < boxesCount; ++i) {
			var randX = Math.ceil(Math.random() * dimensions.width), randY = Math.ceil(Math.random() * dimensions.height);
			var r = Math.ceil(Math.random() * 255), g = Math.ceil(Math.random() * 255), b = Math.ceil(Math.random() * 255);
			boxes.push({
				width: randX,
				height: randY,
				color: 'rgb(' + r + ',' + g + ',' + b + ')'
			});
		}
		this.doSimulation(dimensions, boxes, autoPlay);
	},
	doSampleSimulation: function (autoPlay) {
		var boxes = [{
			width: 1,
			height: 2,
			color: 'red'
		}, {
			width: 2,
			height: 1,
			color: 'green'
		}, {
			width: 2,
			height: 1,
			color: 'blue'
		}, {
			width: 3,
			height: 1,
			color: 'pink'
		}, {
			width: 1,
			height: 2,
			color: 'purple'
		}, {
			width: 1,
			height: 3,
			color: 'yellow'
		}, {
			width: 1,
			height: 1,
			color: 'brown'
		}, {
			width: 2,
			height: 1,
			color: 'grey'
		}];
		this.doSimulation({
			width: 4,
			height: 4
		}, boxes);
	}
});