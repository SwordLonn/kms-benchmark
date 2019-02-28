var logger = require('rloud-logger').logger(__filename);
//
var inherits = require('util').inherits;
var Webrtc = require('../utils/webrtc.js');
var Promise = require('bluebird');

function MsWebRTC(pipeline) {
  MsWebRTC.super_.call(this, pipeline);
  this.uuid = null;

  var self = this;
  this.on('onStateChange', function (event) {
    if (event.dtlsState == 'connected')
      self.emit('connected');
  });
  self.promise = self.pipeline.createElement('WebRTC', null).then((uuid) => {
    self.uuid = uuid;
  });
}
inherits(MsWebRTC, Webrtc);

MsWebRTC.prototype.createOffer = function () {
  return this.invoke({ method: 'generateOffer' }).then((res) => {
    return res.sdpOffer;
  });
}

MsWebRTC.prototype.processSdpAnswer = function (answer) {
  return this.invoke({
    method: 'processAnswer',
    sdpAnswer: answer
  });
}

MsWebRTC.prototype.processSdpOffer = function (offer) {
  return this.invoke({
    method: 'processOffer',
    sdpOffer: offer
  }).then((res) => {
    return res.sdpAnswer;
  });
}

MsWebRTC.prototype.addIceCandidate = function (candidate) {
  return this.invoke({
    method: 'addIceCandidate',
    candidate: candidate
  });
}

MsWebRTC.prototype.gatherCandidates = function () {
  return this.invoke({ method: 'gatherCandidates' });
};

MsWebRTC.prototype.connect = function (pass) {
  if (pass.type !== 'PassThrough') {
    return Promise.reject(`WebRTC connect not support element type ${pass.type}`);
  }
  MsWebRTC.super_.prototype.connect.call(this, pass);
  pass.handleConnected();
  return Promise.resolve();
}

MsWebRTC.prototype.release = function () {
  this.pipeline.releaseElement(this);
  MsWebRTC.super_.prototype.release.call(this);
}

MsWebRTC.prototype.invoke = function (params) {
  var self = this;
  return this.promise.then(() => {
    return self.pipeline.invoke(self, params);
  });
}

MsWebRTC.prototype.getStats = function () {
  return this.invoke({
    method: 'getStats'
  });
}

module.exports = MsWebRTC;
