var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits
var Plumber = require('../utils/plumber.js')

function MsPlumber(pipeline, uuid) {
  MsPlumber.super_.call(this, pipeline);
  this.uuid = null;
  var self = this;
  this.on('onStateChange', function (event) {
    if (event.dtlsState == 'connected')
      self.emit('connected');
  });
  this.promise = self.pipeline.createElement('WebRTC', null).then((uuid) => {
    self.uuid = uuid;
  });
}

inherits(MsPlumber, Plumber);

MsPlumber.prototype.connect = function (pass) {
  if (pass.type !== 'PassThrough' && pass.type !== 'Decoder') {
    return Promise.reject(`MsPlumber connect not support element type : ${pass.type}`);
  }
  MsPlumber.super_.prototype.connect.call(this, pass);
  pass.handleConnected();
  if (pass.type === 'Decoder') {
    Promise.all([
        this.promise,
        pass.promise,
    ]).then(()=>{
      this.pipeline.connect(this, pass);
    })
  }
  return Promise.resolve();
}

MsPlumber.prototype.disconnect = function () {
  MsPlumber.super_.prototype.disconnect.call(this);
}

MsPlumber.prototype.processSdpOffer = function (offer) {
  return this.invoke({
    method: 'processOffer',
    sdpOffer: offer
  }).then((res) => {
    return res.sdpAnswer;
  });
}

MsPlumber.prototype.processSdpAnswer = function (answer) {
  return this.invoke({
    method: 'processAnswer',
    sdpAnswer: answer
  });
}

MsPlumber.prototype.gatherCandidates = function () {
  return this.invoke({ method: 'gatherCandidates' });
}

MsPlumber.prototype.addIceCandidate = function (candidate) {
  return this.invoke({
    method: 'addIceCandidate',
    candidate: candidate
  });
}

MsPlumber.prototype.createOffer = function (options) {
  return this.invoke({
    method: 'generateOffer',
    options: options
  }).then((res) => {
    return res.sdpOffer;
  });
}

MsPlumber.prototype.link = function (plumber, params) {
  MsPlumber.super_.prototype.link.call(this, plumber);
  var self = this;
  self.on('onIceCandidate', plumber.addIceCandidate.bind(plumber));
  plumber.on('onIceCandidate', self.addIceCandidate.bind(self));
  params.direct = 'sendonly';
  self.createOffer(params).then((offer) => {
    return plumber.processSdpOffer(offer);
  }).then((answer) => {
    self.processSdpAnswer(answer);
  }).then(() => {
    self.gatherCandidates();
    plumber.gatherCandidates();
  });
  return Promise.resolve();
}

MsPlumber.prototype.getMediaElement = function () {
}

MsPlumber.prototype.getLinkedTo = function () {
  return this.linkedTo;
}

MsPlumber.prototype.release = function () {
  this.pipeline.releaseElement(this);
  MsPlumber.super_.prototype.release.call(this);
}

MsPlumber.prototype.invoke = function (params) {
  var self = this;
  return this.promise.then(() => {
    return self.pipeline.invoke(self, params);
  });
}

MsPlumber.prototype.getStats = function () {
  return this.invoke({
    method: 'getStats'
  });
}

module.exports = MsPlumber;
