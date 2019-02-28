var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Rtp(pipeline) {
  Rtp.super_.call(this, pipeline);
  this.type = 'RTP';
}

inherits(Rtp, Element);

Rtp.prototype.processSdpOffer = function (sdpOffer) {
  logger.debug(__line + 'Rtp processSdpOffer');
}

Rtp.prototype.processSdpAnswer = function (sdpAnswer) {
  logger.debug(__line + 'Rtp processSdpAnswer');
}

Rtp.prototype.getMediaElement = function () {
  logger.debug(__line + 'Rtp getMediaElemet');
}

Rtp.prototype.createOffer = function () {
  logger.debug(__line + 'Rtp createOffer');
}

Rtp.prototype.release = function () {
  logger.debug(__line + 'Rtp release');
  Rtp.super_.prototype.release.call(this);
}

Rtp.prototype.connect = function (element) {
  Rtp.super_.prototype.connect.call(this, element);
}

Rtp.prototype.disconnect = function (element) {
  Rtp.super_.prototype.disconnect.call(this, element);
}

module.exports = Rtp;






