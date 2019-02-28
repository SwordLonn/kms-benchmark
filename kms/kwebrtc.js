var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var inherits = require('util').inherits

var getBitrateOfSdp = require('rloud-utils').sdphelper.getBitrateOfSdp

//var Element = require('./element.js')
var Webrtc = require('../utils/webrtc.js')
var Promise = require('bluebird')

function KWebrtc(pipeline) {
  KWebrtc.super_.call(this, pipeline);
  var self = this;

  this.endpoint = Promise.resolve().then(function () {
    return pipeline.mediaPipeline.then(function (pipe) {
      return Promise.promisify(pipe.create, pipe)('WebRtcEndpoint');
    }).then(function (point) {
      point.on('OnIceComponentStateChanged', self.emit.bind(self, 'onStateChanged'));
      point.on('OnIceCandidate', (event) => {
        self.emit('onIceCandidate', event.candidate);
      });
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

inherits(KWebrtc, Webrtc);

KWebrtc.prototype.processSdpOffer = function (sdpOffer) {
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

KWebrtc.prototype.gatherCandidates = function () {
  this.endpoint.then(function (point) {
    point.gatherCandidates();
  }).catch(function (error) {
    logger.error(__line + strerr(error));
  });
}

KWebrtc.prototype.addIceCandidate = function (candidate) {
  return this.endpoint.then(function (point) {
    point.addIceCandidate(candidate);
  }).catch(function (error) {
    logger.error(__line + strerr(error));
  });
}

KWebrtc.prototype.getMediaElement = function () {
  return this.endpoint;
}

KWebrtc.prototype.release = function () {
  this.endpoint.then(function (point) {
    point.release();
  }).catch(function (error) {
    logger.error(__line + strerr(error));
  });
  KWebrtc.super_.prototype.release.call(this);
}

KWebrtc.prototype.disconnect = function () {
  KWebrtc.super_.prototype.disconnect.call(this);
}

KWebrtc.prototype.connect = function (element) {
  logger.debug(__line + ' connt this ' + this.label + ' to ' + element.label);
  KWebrtc.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([self.endpoint, element.endpoint]).then((points) => {
    return Promise.promisify(points[0].connect, points[0])(points[1]);
  }).catch((error) => {
    logger.error(`${__line} error ${strerr(error)}`);
    throw error;
  });
}

KWebrtc.prototype.getStats = function () {
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.getStats, point)();
  });
}

module.exports = KWebrtc;
