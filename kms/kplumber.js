var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var getBitrateOfSdp = require('rloud-utils').sdphelper.getBitrateOfSdp
var InsertDirectToSdp = require('rloud-utils').sdphelper.InsertDirectToSdp
var removeSsrcs = require('rloud-utils').sdphelper.removeSsrcs
var inherits = require('util').inherits
var kurento = require('kurento-client')
var Plumber = require('../utils/plumber.js')
var Promise = require('bluebird')

function KPlumber(pipeline) {
  KPlumber.super_.call(this, pipeline);
  this.linkedTo = null;
  this.endpoint = null;
  this.onStateChanged = null;
  this.direct = 'sendrecv';
  var self = this;
  this.endpoint = Promise.resolve().then(function () {
    return pipeline.mediaPipeline.then(function (pipe) {
      return Promise.promisify(pipe.create, pipe)('WebRtcEndpoint');
    }).then(function (point) {
      point.on('OnIceComponentStateChanged', self.emit.bind(self, 'onStateChanged'));
      point.on('OnIceCandidate', (event) => { self.emit('onIceCandidate', event.candidate); });
      point.on('MediaFlowOutStateChange', self.emit.bind(self, 'onStateChanged'));
      point.on('MediaFlowInStateChange', self.emit.bind(self, 'onStateChanged'));
      point.on('ConnectionStateChanged', self.emit.bind(self, 'onStateChanged'));
      point.on('ConnectionStateChanged', (event) => {
        if (event.newState == 'CONNECTED') {
          self.emit('connected');
        }
      });
      point.on('MediaStateChanged', self.emit.bind(self, 'onStateChanged'));
      return point;
    });
  });
}
inherits(KPlumber, Plumber);

KPlumber.prototype.connect = function (element) {
  KPlumber.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([self.endpoint, element.endpoint]).then((points) => {
    return Promise.promisify(points[0].connect, points[0])(points[1]);
  }).catch((error) => {
    logger.error(`${__line} error ${strerr(error)}`);
    throw error;
  });
}

KPlumber.prototype.processSdpOffer = function (sdpOffer) {
  var self = this;
  var br = getBitrateOfSdp(sdpOffer);
  return self.endpoint.then((point) => {
    if (br.audio)
      point.setMaxAudioRecvBandwidth(br.audio);
    if (br.video) {
      point.setMaxVideoRecvBandwidth(br.video);
      point.setMinVideoRecvBandwidth(30);
      point.setMaxVideoSendBandwidth(br.video);
    }
    return Promise.promisify(point.processOffer, point)(sdpOffer);
  });
}

KPlumber.prototype.processSdpAnswer = function (sdpAnswer) {
  return this.endpoint.then((point) => {
    return Promise.promisify(point.processAnswer, point)(sdpAnswer);
  });
}

KPlumber.prototype.gatherCandidates = function () {
  return this.endpoint.then((point) => {
    point.gatherCandidates();
  });
}

KPlumber.prototype.addIceCandidate = function (candidate) {
  return this.endpoint.then((point) => {
    candidate = kurento.register.complexTypes.IceCandidate(candidate);
    return Promise.promisify(point.addIceCandidate, point)(candidate);
  });
}

KPlumber.prototype.createOffer = function (options) {
  var self = this;
  self.direct = options.direct || self.direct;
  return this.endpoint.then(function (point) {
    if (options && options.abitrate) {
      point.setMaxAudioRecvBandwidth(options.abitrate);
    }
    if (options && options.vbitrate) {
      point.setMaxVideoRecvBandwidth(options.vbitrate);
      point.setMaxVideoSendBandwidth(options.vbitrate);
    }
    return Promise.promisify(point.generateOffer2, point)(self.direct,
      options.audio ? options.acodec : 'opus',
      options.video ? options.vcodec : 'H264').then(function (sdp) {
        if (self.direct) {
          sdp = InsertDirectToSdp(sdp, self.direct);
          if (self.direct == 'recvonly') {
            sdp = removeSsrcs(sdp);
          }
        }
        return sdp;
      });
  });
}

KPlumber.prototype.link = function (plumber, params) {
  KPlumber.super_.prototype.link.call(this, plumber);
  var self = this;
  self.on('onIceCandidate', (candidate) => {
    candidate = kurento.register.complexTypes.IceCandidate(candidate);
    plumber.addIceCandidate(candidate);
  });
  plumber.on('onIceCandidate', (candidate) => {
    candidate = kurento.register.complexTypes.IceCandidate(candidate);
    self.addIceCandidate(candidate);
  });
  params.direct = 'sendonly';
  return self.createOffer(params).then((sdpOffer) => {
    self.gatherCandidates();
    return plumber.processSdpOffer(sdpOffer);
  }).then((sdpAnswer) => {
    plumber.gatherCandidates();
    return self.processSdpAnswer(sdpAnswer);
  });
}

KPlumber.prototype.getMediaElement = function () {
  return this.endpoint;
}

KPlumber.prototype.getLinkedTo = function () {
  return this.linkedTo;
}

KPlumber.prototype.release = function () {
  this.endpoint.then(function (point) {
    point.release();
  });
  KPlumber.super_.prototype.release.call(this);
}

KPlumber.prototype.getStats = function () {
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.getStats, point)();
  });
}

module.exports = KPlumber;
