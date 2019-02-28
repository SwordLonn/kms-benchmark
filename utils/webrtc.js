var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Webrtc(pipeline) {
  Webrtc.super_.call(this, pipeline);
  this.type = 'WebRTC';
}

inherits(Webrtc, Element);

Webrtc.prototype.processSdpOffer = function (sdpOffer) {
  logger.debug(__line + 'Webrtc processSdpOffer');
}

Webrtc.prototype.processSdpAnswer = function (sdpAnswer) {
  logger.debug(__line + 'Webrtc processSdpAnswer');
}

Webrtc.prototype.gatherCandidates = function () {
  logger.debug(__line + 'Webrtc gatherCandidates');
}

Webrtc.prototype.addIceCandidate = function (candidate) {
  logger.debug(__line + 'Webrtc addIceCandidate');
}

Webrtc.prototype.getMediaElement = function () {
  logger.debug(__line + 'Webrtc getMediaElemet');
}

Webrtc.prototype.createOffer = function () {
  logger.debug(__line + 'Webrtc createOffer');
}

Webrtc.prototype.release = function () {
  logger.debug(__line + 'Webrtc release');
  Webrtc.super_.prototype.release.call(this);
}

Webrtc.prototype.connect = function (element) {
  Webrtc.super_.prototype.connect.call(this, element);
}

Webrtc.prototype.disconnect = function (element) {
  Webrtc.super_.prototype.disconnect.call(this, element);
}

module.exports = Webrtc;

