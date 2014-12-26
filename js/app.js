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
	}
});