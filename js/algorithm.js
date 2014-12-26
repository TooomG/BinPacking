/**
 * Created by tom on 19/12/14.
 */


var BinPackingAlgorithm = Class.extend({
	init: function(gridX, gridY) {
		this.gridX = gridX;
		this.gridY = gridY;
	},
	setDimensions: function(x, y) {
		this.gridX = x;
		this.gridY = y;
	},
	apply: function(boxes, gridX, gridY) {
		throw "Unimplemented algorithm.";
	},
	newGrid: function() {
		var grid = [];
		for (var j = 0; j < this.gridY; ++j) {
			var line = [];
			for (var i = 0; i < this.gridX; ++i) {
				line.push(0);
			}
			grid.push(line);
		}
		return grid;
	}
});

var SortBinPacking = BinPackingAlgorithm.extend({
	init: function(gridX, gridY, sorter) {
		this._super(gridX, gridY);
		this.sorter = sorter;
	},
	apply: function(boxes) {
		var grids = [this.newGrid()];
		var sortedBoxes = this.sorter.sort(boxes);

		var result = {
			grids: grids,
			placement: [[]]
		};

		for (var i in sortedBoxes) {
			if (! sortedBoxes.hasOwnProperty(i)) continue;
			var box = sortedBoxes[i];
			if (! this.placeBox(box, grids, result)) {
				throw "Could not place box: "+JSON.stringify(box);
			}
		}
		result.gridsCount = grids.length;
		return result;
	},
	placeBox: function(box, grids, result) {
		if (box.width > this.gridX || box.height > this.gridY) {
			throw "Invalid box dimensions: "+JSON.stringify(box);
		}
		//console.log("Placing "+box.width+","+box.height);
		// Try to place in each grid
		for (var gi in grids) {
			if (! grids.hasOwnProperty(gi)) continue;
			var grid = grids[gi];
			// Browse the cells of the grid to try to place the box
			for (var lineI = 0; lineI <= grid.length - box.height; ++lineI) {
				for (var columnI = 0; columnI <= grid[0].length - box.width; ++columnI) {
					if (this.canPlaceAt(box, grid, columnI, lineI)) {
						//console.log("At ", columnI, lineI);
						this.placeAt(box, grid, columnI, lineI);
						result.placement[gi].push({boxID:box.id, x:columnI, y: lineI});
						return true;
					}
				}
			}
		}
		// If we get here, we didn't have the possibility to place the box in the existing boxes
		// So we have to create a new grid.
		//console.log("Creating new grid");
		var newGrid = this.newGrid();
		this.placeAt(box, newGrid, 0, 0);
		result.placement.push([]);
		result.placement[result.placement.length-1].push({boxID:box.id, x:0, y: 0});
		grids.push(newGrid);

		return true;
	},
	canPlaceAt: function(box, grid, x, y) {
		// Browse all the cells that the box would occupy
		for (var j = y; j < y+box.height; ++j) {
			for (var i = x; i < x+box.width; ++i) {
				if (grid[j][i] != 0) return false;	// occupation test
			}
		}
		return true;
	},
	placeAt: function(box, grid, x, y) {
		// Browse all the cells that the box will occupy
		for (var j = y; j < y+box.height; ++j) {
			for (var i = x; i < x+box.width; ++i) {
				grid[j][i] = 1;
			}
		}
	}
});

var BoxSorter = Class.extend({
	init: function() {
		// do nothing
	},
	compare: function(a, b) {
		throw "Not implemented!";
	},
	sort: function(boxes) {
		// Insertion sort
		var result = [];
		for (var i in boxes) {
			if (! boxes.hasOwnProperty(i)) continue;
			var c = boxes[i];
			var j = 0;
			for (;j < result.length; ++j ) {
				var c2 = result[j];
				if (this.compare(c, c2) > 0) break;
			}
			result.splice(j, 0, c);
		}
		return result;
	}
});

var HeightSorter = BoxSorter.extend({
	compare: function(a, b) {
		var heightDiff = a.height - b.height;
		if (heightDiff == 0) return a.width - b.width;
		return heightDiff;
	}
});

var AreaSorter = BoxSorter.extend({
	compare: function(a, b) {
		var aArea = a.width * a.height,
			bArea = b.width * b.height;
		return aArea - bArea;
	}
});