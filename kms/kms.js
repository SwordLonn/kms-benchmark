var logger = require('rloud-logger').logger(__filename)
var inherits = require('util').inherits
var KPipeline = require('./kpipeline.js')
var Ims = require('../utils/ims.js')

var supported = {
  'transport': true,
  'transcode': true,
  'record': true,
  'mix': true,
  'play': true,
  'analyze': false,
};

function Kms(label, client) {
  Kms.super_.call(this, label, client);
  var self = this;
  client.on('disconnect', function () {
    logger.warn(__line + ' kms client disconnected.');
    self.emit('disconnect');
  });
}

inherits(Kms, Ims);

Kms.prototype.createPipeline = function () {
  logger.debug(__line + 'create pipeline.');
  var pipeline = new KPipeline(this);
  pipeline.label = this.label + '.pipeline.' + this.number;
  this.number++;
  this.pipelines[pipeline.label] = pipeline;
  return pipeline;
}

Kms.prototype.support = function (domain) {
  return !domain || supported[domain];
}

module.exports = Kms;
