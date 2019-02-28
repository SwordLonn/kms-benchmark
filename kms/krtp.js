var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var Promise = require('bluebird')
var inherits = require('util').inherits

//var Element = require('./element.js')
var Rtp = require('../utils/rtp.js')


function KRtp(pipeline) {
  KRtp.super_.call(this, pipeline);
  var self = this;

  this.endpoint = pipeline.mediaPipeline.then((pipe) => {
    return Promise.promisify(pipe.create.bind(pipe))('RtpEndpoint');
  });
}

inherits(KRtp, Rtp);

KRtp.prototype.processSdpOffer = function (sdpOffer, options) {
  var self = this;
  return self.endpoint.then((point) => {
    if (options && options.audioBitrate) {
      point.setMaxAudioRecvBandwidth(options.audioBitrate);
    }
    if (options && options.videoBitrate) {
      point.setMaxVideoRecvBandwidth(options.videoBitrate);
      point.setMaxVideoSendBandwidth(options.videoBitrate);
    }
    return Promise.promisify(point.processOffer.bind(point))(sdpOffer);
  });
}

KRtp.prototype.getMediaElement = function () {
  return this.endpoint;
}

KRtp.prototype.release = function () {
  this.endpoint.then(function (point) {
    point.release();
  }).catch(function (error) {
    logger.error(__line + strerr(error));
  });
  KRtp.super_.prototype.release.call(this);
}

KRtp.prototype.disconnect = function () {
  KRtp.super_.prototype.disconnect.call(this);
}

KRtp.prototype.connect = function (element) {
  logger.debug(__line + 'element : ' + element.label);
  logger.debug(__line + 'this : ' + this.label);
  KRtp.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.promisify([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}
module.exports = KRtp;






