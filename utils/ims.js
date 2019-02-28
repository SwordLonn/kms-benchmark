var logger = require('rloud-logger').logger(__filename);

var inherits = require('util').inherits;
var Pipeline = require('./pipeline.js');
var Kobj = require('./kobj.js');

//var number = 0;

function IMS(label, client) {
  IMS.super_.call(this);
  this.label = label;
  this.pipelines = {};
  this.client = client;
  this.number = 0;
}
inherits(IMS, Kobj);

IMS.prototype.createPipeline = function() {
  logger.debug(__line + 'not impl.');
};

IMS.prototype.getPipelines = function() {
  return this.pipelines;
};

IMS.prototype.setLoadManager = function(manager) {};

IMS.prototype.getLoad = function() {};

IMS.prototype.allowMoreElements = function() {};

IMS.prototype.removePipeline = function(pipeline) {
  logger.debug(
    __line + 'IMS ' + this.label + ' remove pipeline ' + pipeline.label
  );
  delete this.pipelines[pipeline.label];
};

IMS.prototype.support = function(domain) {
  return !domain;
};

module.exports = IMS;
