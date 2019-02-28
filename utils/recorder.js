var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Recorder(pipeline, uri, profile) {
  Recorder.super_.call(this, pipeline);
  this.type = 'Recorder';
  this.uri = uri;
  logger.debug(__line + 'create Recorder ' + this.label);
}

inherits(Recorder, Element);

Recorder.prototype.record = function () {
  logger.debug(__line + 'record');
}

Recorder.prototype.connect = function (element) {
  Recorder.super_.prototype.connect.call(this, element);
}

Recorder.prototype.disconnect = function () {
  Recorder.super_.prototype.disconnect.call(this);
}

Recorder.prototype.release = function () {
  Recorder.super_.prototype.release.call(this);
}

module.exports = Recorder;






