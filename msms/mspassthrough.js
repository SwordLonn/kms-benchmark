var logger = require('rloud-logger').logger(__filename);
var inherits = require('util').inherits;
var PassThrough = require('../utils/passthrough.js');

function MsPassThrough(pipeline) {
  MsPassThrough.super_.call(this, pipeline);
  this.parserId = undefined;
}
inherits(MsPassThrough, PassThrough);

MsPassThrough.prototype.release = function () {
  MsPassThrough.super_.prototype.release.call(this);
};

MsPassThrough.prototype.disconnect = function () {
  MsPassThrough.super_.prototype.disconnect.call(this);
};

MsPassThrough.prototype.connect = function (element) {
  MsPassThrough.super_.prototype.connect.call(this, element);
  var self = this;
  if (this.source !== null) {
    logger.info(__line + ' source not null, connect direct ' + this.label + ' to ' + element.label);
    Promise.all([
      this.source.promise,
      element.promise
    ]).then(() => {
      return self.pipeline.connect(self.source, element, self.parserId);
    });
  } else {
    logger.info(__line + ' source is null, pending to connect ' + this.label + ' to ' + element.label);
  }
  return Promise.resolve();
};

MsPassThrough.prototype.handleConnected = function (parserId) {
  this.parserId = parserId;
  // connect sinks
  var self = this;
  return Promise.all(this.sinks.map((sink) => {
    return Promise.all([
      self.source.promise,
      sink.promise
    ]).then(() => {
      logger.info(__line + ' link source ' + self.label + ' to pending sink ' + sink.label);
      return self.pipeline.connect(self.source, sink, parserId);
    });
  }));
}

module.exports = MsPassThrough;