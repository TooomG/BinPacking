/**
 * Created by tom on 26/12/14.
 */

var SimulationViewer = Class.extend({
	init: function (canvasID) {
		this.canvas = document.getElementById("main")
		this.ctx = this.canvas.getContext('2d');

		// Default values
		this.scale = 5;
		this.margin = 10;

		this.maxHeight = 0;

		this.cubes = null;
		this.grids = null;
		this.result = null;

		this.animationDuration = 400;

		this.startOfOutput = null; // rendering helper. coordinates of the output rendering anchor.
	},
	setCubes: function (cubes) {
		var maxHeight = 0;
		// Update the cubes indexes
		for (var ci in cubes) {
			if (!cubes.hasOwnProperty(ci)) continue;
			cubes[ci].id = ci;
			cubes[ci].positionX = 0;
			cubes[ci].positionY = 0;
			cubes[ci].offsetX = 0;
			cubes[ci].offsetY = 0;
			cubes[ci].targetX = 0;
			cubes[ci].targetY = 0;

			// Let's calculate max cube height
			if (cubes[ci].height > maxHeight) maxHeight = cubes[ci].height;
		}
		// Store the max height for rendering purposes
		this.maxHeight = maxHeight;
		this.rowHeight = maxHeight * this.scale;

		this.cubes = cubes;
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
	 * Setup the cubes to their initial positions.
	 * Returns the starting point of the output.
	 */
	setupCubesPositions: function () {
		// Distribute input cubes
		var x = this.margin;
		var y = this.rowHeight + this.margin;
		var i;
		for (i = 0; i < this.cubes.length; ++i) {
			var c = this.cubes[i];
			if (x + c.width * this.scale >= this.canvas.width) {
				x = this.margin;
				y += this.rowHeight + this.margin;
			}

			c.positionX = x;
			c.positionY = y - c.height * this.scale;

			// Store initial position apart from the position to draw ghost cubes.
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
	 * Compute the final position of the cube according to the output of the algorithm.
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

			// Setup the cubes positions
			var placements = this.result.placement[i];
			var pi;
			for (pi in placements) {
				if (!placements.hasOwnProperty(pi))
					continue;
				var p = placements[pi];
				var cube = this.cubes[p.cubeID];
				cube.targetX = x + p.x * this.scale;
				cube.targetY = y + p.y * this.scale;
			}

			x += width + this.margin;		// Increase X
		}

		// Increase canvas size to fit everything
		this.canvas.height = y + height + this.margin;
	},

	moveCube: function (cube, targetX, targetY, callback) {
		var self = this;
		$(cube).animate({
			offsetX: targetX - cube.positionX,
			offsetY: targetY - cube.positionY
		}, {
			duration: this.animationDuration,
			step: function (cube) {
				self.draw();
			},
			complete: function () {
				cube.offsetX = 0;
				cube.offsetY = 0;
				cube.positionX = targetX;
				cube.positionY = targetY;
				self.draw(/*cubes, grids*/);
				if (callback) callback();
			}
		});
	},

	draw: function () {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Drawing input cubes
		this.ctx.strokeStyle = 'red';
		var i, c;
		for (i = 0; i < this.cubes.length; ++i) {
			c = this.cubes[i];

			this.ctx.fillStyle = c.color;
			/*ctx.fillRect(x, y - c.height * scale, c.width * scale, c.height * scale);
			 ctx.fillRect(x, y - c.height * scale, c.width * scale, c.height * scale);*/
			this.ctx.beginPath();
			this.ctx.rect(Math.floor(c.positionX + c.offsetX),
				Math.floor(c.positionY + c.offsetY),
				c.width * this.scale  - this.ctx.lineWidth, c.height * this.scale - this.ctx.lineWidth);
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
			this.ctx.rect(x, y, width, height);
			this.ctx.stroke();

			x += width + this.margin;
		}
	},

	/**
	 * Performs the cube animation.
	 */
	doMoveCubes: function () {
		var self = this;
		var cubesAnimation = [];
		var moveNextCube = function () {
			if (cubesAnimation.length == 0)
				return;
			var cube = cubesAnimation.shift();
			self.moveCube(cube, cube.targetX, cube.targetY, function () {
				moveNextCube()
			});
		};

		// Create a queue of cubes that has to be moved.
		var i;
		for (i in this.cubes) {
			if (!this.cubes.hasOwnProperty(i)) continue;
			cubesAnimation.push(this.cubes[i]);
		}
		// Process the queue
		moveNextCube();
	},

	loadResult: function (result) {
		this.result = result;
		this.grids = result.grids;

		this.updateRenderingAnchors();
	},

	updateRenderingAnchors: function() {
		this.startOfOutput = this.setupCubesPositions();

		// Update the coordinate of output rendering anchor.
		this.startOfOutput.x = this.margin;
		this.startOfOutput.y += this.margin;

		this.setupSolutionAnimation();
	},

	/**
	 * Performs a simulation with a given set of cubes.
	 * For debugging purpose only.
	 */
	doSimulation: function (dimensions, cubes, autoPlay) {
		console.warn("SimulationViewer.doSimulation() should only be used for debugging purposes.");
		if (autoPlay === undefined) autoPlay = true;
		this.setCubes(cubes);

		var algorithm = new SortBinPacking(dimensions.width, dimensions.height, new HeightSorter());
		console.log("Computing result...");
		var result = algorithm.apply(cubes);
		console.log("Solution found!");

		this.loadResult(result);
		this.draw();
	},
	doRandomSimulation: function (autoPlay) {
		console.warn("SimulationViewer.doRandomSimulation() should only be used for debugging purposes.");
		var dimensions = {
			width: 20,
			height: 20
		};
		var cubesCount = 100;

		var cubes = [];
		for (var i = 0; i < cubesCount; ++i) {
			var randX = Math.ceil(Math.random() * dimensions.width), randY = Math.ceil(Math.random() * dimensions.height);
			var r = Math.ceil(Math.random() * 255), g = Math.ceil(Math.random() * 255), b = Math.ceil(Math.random() * 255);
			cubes.push({
				width: randX,
				height: randY,
				color: 'rgb(' + r + ',' + g + ',' + b + ')'
			});
		}
		this.doSimulation(dimensions, cubes, autoPlay);
	},
	doSampleSimulation: function (autoPlay) {
		var cubes = [{
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
		}, cubes);
	}
});