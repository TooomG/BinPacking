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
	apply: function(cubes, gridX, gridY) {
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
	apply: function(cubes) {
		var grids = [this.newGrid()];
		var sortedCubes = this.sorter.sort(cubes);

		var result = {
			grids: grids,
			placement: [[]]
		};

		for (var i in sortedCubes) {
			if (! sortedCubes.hasOwnProperty(i)) continue;
			var cube = sortedCubes[i];
			if (! this.placeCube(cube, grids, result)) {
				throw "Could not place cube: "+JSON.stringify(cube);
			}
		}
		result.gridsCount = grids.length;
		return result;
	},
	placeCube: function(cube, grids, result) {
		if (cube.width > this.gridX || cube.height > this.gridY) {
			throw "Invalid cube dimensions: "+JSON.stringify(cube);
		}
		//console.log("Placing "+cube.width+","+cube.height);
		// Try to place in each grid
		for (var gi in grids) {
			if (! grids.hasOwnProperty(gi)) continue;
			var grid = grids[gi];
			// Browse the cells of the grid to try to place the cube
			for (var lineI = 0; lineI <= grid.length - cube.height; ++lineI) {
				for (var columnI = 0; columnI <= grid[0].length - cube.width; ++columnI) {
					if (this.canPlaceAt(cube, grid, columnI, lineI)) {
						//console.log("At ", columnI, lineI);
						this.placeAt(cube, grid, columnI, lineI);
						result.placement[gi].push({cubeID:cube.id, x:columnI, y: lineI});
						return true;
					}
				}
			}
		}
		// If we get here, we didn't have the possibility to place the cube in the existing boxes
		// So we have to create a new grid.
		//console.log("Creating new grid");
		var newGrid = this.newGrid();
		this.placeAt(cube, newGrid, 0, 0);
		result.placement.push([]);
		result.placement[result.placement.length-1].push({cubeID:cube.id, x:0, y: 0});
		grids.push(newGrid);

		return true;
	},
	canPlaceAt: function(cube, grid, x, y) {
		// Browse all the cells that the cube would occupy
		for (var j = y; j < y+cube.height; ++j) {
			for (var i = x; i < x+cube.width; ++i) {
				if (grid[j][i] != 0) return false;	// occupation test
			}
		}
		return true;
	},
	placeAt: function(cube, grid, x, y) {
		// Browse all the cells that the cube will occupy
		for (var j = y; j < y+cube.height; ++j) {
			for (var i = x; i < x+cube.width; ++i) {
				grid[j][i] = 1;
			}
		}
	}
});

var CubeSorter = Class.extend({
	init: function() {
		// do nothing
	},
	compare: function(a, b) {
		throw "Not implemented!";
	},
	sort: function(cubes) {
		// Insertion sort
		var result = [];
		for (var i in cubes) {
			if (! cubes.hasOwnProperty(i)) continue;
			var c = cubes[i];
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

var HeightSorter = CubeSorter.extend({
	compare: function(a, b) {
		var heightDiff = a.height - b.height;
		if (heightDiff == 0) return a.width - b.width;
		return heightDiff;
	}
});

var AreaSorter = CubeSorter.extend({
	compare: function(a, b) {
		var aArea = a.width * a.height,
			bArea = b.width * b.height;
		return aArea - bArea;
	}
});