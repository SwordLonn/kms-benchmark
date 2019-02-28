var logger = require('rloud-logger').logger(__filename)
var inherits = require('util').inherits
var LiPipeline = require('./lipipeline.js')
var Ims = require('../utils/ims.js')

function Lims(label, client) {
  Lims.super_.call(this, label, client);
}

inherits(Lims, Ims);

Lims.prototype.createPipeline = function () {
  logger.info(__line + 'create pipeline.');
  var pipeline = new LiPipeline(this);
  pipeline.label = this.label + '.pipeline.' + this.number;
  this.number++;
  this.pipelines[pipeline.label] = pipeline;
  return pipeline;
}


module.exports = Lims;
