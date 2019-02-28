var logger = require('rloud-logger').logger(__filename)
var inherits = require('util').inherits
var Obj = require('./kobj.js')

function Hub(pipeline, label) {
  Hub.super_.call(this);
  this.pipeline = pipeline;
  this.label = label;
  this.ports = {};
}

inherits(Hub, Obj);

Hub.prototype.createHubPort = function (options) {
  logger.debug(__line + 'not impl.');
}

module.exports = Hub;
