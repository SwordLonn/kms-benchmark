var logger = require('rloud-logger').logger(__filename)
var Promise = require('bluebird')
var url = require('url')
var inherits = require('util').inherits
//var Element = require('./element.js')
var kurento = require('kurento-client')
var Plumber = require('../utils/plumber.js')
var UpdateHostAddress = require('rloud-utils').sdphelper.updateHostAddress;

function KPlumber(pipeline) {
  KPlumber.super_.call(this, pipeline);
  this.linkedTo = null;
  this.endpoint = null;
  this.host = url.parse(pipeline.kms.label).hostname;
  var self = this;

  this.endpoint = pipeline.mediaPipeline.then((pipe) => {
    return Promise.promisify(pipe.create.bind(pipe))('RtpEndpoint').then((point) => {
      point.on('MediaFlowOutStateChange', (event) => {
        logger.debug(`${__line} MediaFlowOutStateChange ${self.label} type ${self.type} ${JSON.stringify(event)}`);
      });
      point.on('MediaFlowInStateChange', (event) => {
        logger.debug(`${__line} MediaFlowInStateChange ${self.label} type ${self.type} ${JSON.stringify(event)}`);
      });
      return point;
    });
  });
}
inherits(KPlumber, Plumber);

KPlumber.prototype.connect = function (element) {
  KPlumber.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}

KPlumber.prototype.processSdpOffer = function (offer) {
  var self = this;
  return self.endpoint.then((point) => {
    return Promise.promisify(point.processOffer.bind(point))(offer);
  }).then((answer) => {
    return UpdateHostAddress(answer, self.host);
  });
}

KPlumber.prototype.processSdpAnswer = function (answer) {
  var self = this;
  return self.endpoint.then((point) => {
    return Promise.promisify(point.processAnswer.bind(point))(answer);
  });
}

KPlumber.prototype.gatherCandidates = function () {
  return Promise.resolve();
}

KPlumber.prototype.addIceCandidate = function (candidate) {
  return Promise.resolve();
}

KPlumber.prototype.createOffer = function () {
  var self = this;
  return self.endpoint.then((point) => {
    return point.generateOffer();
  }).then((offer) => {
    return UpdateHostAddress(offer);
  });
}

KPlumber.prototype.link = function (plumber) {
  var self = this;
  return self.createOffer().then((offer) => {
    return plumber.processSdpOffer(offer);
  }).then((answer) => {
    return self.processSdpAnswer(answer);
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

module.exports = KPlumber;
