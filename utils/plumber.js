var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits
var Element = require('./element.js')
var kurento = require('kurento-client')

function Plumber(pipeline) {
  Plumber.super_.call(this, pipeline);
  this.type = 'Plumber';
  this.linkedTo = null;
  this.endpoint = null;
}
inherits(Plumber, Element);

Plumber.prototype.processSdpOffer = function (sdpOffer) {
  logger.debug(__line + 'Plumber processSdpOffer');
}

Plumber.prototype.processSdpAnswer = function (sdpAnswer) {
  logger.debug(__line + 'Plumber processSdpAnswer');
}

Plumber.prototype.gatherCandidates = function () {
  logger.debug(__line + 'Plumber gatherCandidates');
}

Plumber.prototype.addIceCandidate = function (candidate) {
  logger.debug(__line + 'Plumber addIceCandidate');
}

Plumber.prototype.createOffer = function (options) {
  logger.debug(__line + 'Plumber createOffer');
}

Plumber.prototype.connect = function (element) {
  Plumber.super_.prototype.connect.call(this, element);
}

Plumber.prototype.link = function (plumber) {
  this.linkedTo = plumber;
  plumber.linkedTo = this;
}

Plumber.prototype.getMediaElement = function () {
}
Plumber.prototype.getLinkedTo = function () {
}

Plumber.prototype.release = function () {
  logger.debug(__line + 'Plumber release ' + this.label);
  this.releaseLink();
  Plumber.super_.prototype.release.call(this);
}

Plumber.prototype.releaseLink = function () {
  if (this.linkedTo != null) {
    this.linkedTo.linkedTo = null;
  }
}

Plumber.prototype.disconnect = function () {
  Plumber.super_.prototype.disconnect.call(this);
}

Plumber.prototype.invoke = function (params) {
  var self = this;
  logger.debug(__line + 'invoke ' + params.method);
  const mapper = {
    processOffer: () => {
      return self.processSdpOffer(params.sdpOffer).then((answer) => {
        return { sdpAnswer: answer };
      });
    },
    addIceCandidate: () => {
      return self.addIceCandidate(params.candidate);
    },
    generateOffer: () => {
      return self.createOffer(params.options).then((offer) => {
        return { sdpOffer: offer };
      });
    },
    processAnswer: () => {
      return self.processSdpAnswer(params.sdpAnswer);
    },
    gatherCandidates: self.gatherCandidates.bind(self)
  };

  var fun = mapper[params.method];
  if (fun) {
    return fun(params);
  }
  return Promise.reject(` not found method : ${params.method}`);
}

module.exports = Plumber;
