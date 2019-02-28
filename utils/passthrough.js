var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function PassThrough(pipeline) {
  PassThrough.super_.call(this, pipeline);
  var self = this;
  this.type = 'PassThrough';
}

inherits(PassThrough, Element);

PassThrough.prototype.getMediaElement = function () {
  logger.debug(__line + 'PassThrough getMediaElemet');
}

PassThrough.prototype.release = function () {
  logger.debug(__line + 'PassThrough release');
  PassThrough.super_.prototype.release.call(this);
}

PassThrough.prototype.connect = function (element) {
  logger.debug(__line + 'PassThrough connect');
  PassThrough.super_.prototype.connect.call(this, element);
}

PassThrough.prototype.disconnect = function (element) {
  PassThrough.super_.prototype.disconnect.call(this, element);
}

module.exports = PassThrough;
