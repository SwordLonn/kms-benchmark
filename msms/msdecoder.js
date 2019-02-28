var logger = require('rloud-logger').logger(__filename);
//
var inherits = require('util').inherits;
var Decoder = require('../utils/decoder.js');
var Promise = require('bluebird');

function MsDecoder(pipeline, properties) {
  MsDecoder.super_.call(this, pipeline);
  this.uuid = null;
  this.properties = this;

  var self = this;

  self.promise = self.pipeline.
    createElement('Decoder', { properties: properties }).then((uuid) => {
      self.uuid = uuid;
    });
}

inherits(MsDecoder, Decoder);

MsDecoder.prototype.addParser = function (properties) {
  return this.invoke({
    method: 'addParser',
    properties: properties
  }).then((res) => {
    return res;
  })
};

MsDecoder.prototype.delParser = function (parserId) {
  return this.invoke({
    method: 'delParser',
    parserId: parserId,
  }).then((res) => {
    return res;
  })
};

MsDecoder.prototype.connect = function (elem, parserId) {
  var self = this;
  if (elem.type !== 'WebRTC' && elem.type !== 'RTP' &&
    elem.type !== 'Plumber' && elem.type !== 'PassThrough' &&
    elem.type !== 'Hub') {
    return Promise.reject(`Decoder connect not support element type ${elem.type}`);
  }

  MsDecoder.super_.prototype.connect.call(this, elem);
  if (elem.type === 'PassThrough') {
    elem.handleConnected(parserId);
    return Promise.resolve();
  }
  Promise.all([
    this.promise,
    elem.promise,
  ]).then(() => {
    self.pipeline.connect(self, elem, parserId);
  });
  return Promise.resolve();
};

MsDecoder.prototype.release = function () {
  this.pipeline.releaseElement(this);
  MsDecoder.super_.prototype.release.call(this);
};

MsDecoder.prototype.invoke = function (params) {
  var self = this;
  return this.promise.then(() => {
    return self.pipeline.invoke(self, params);
  });
};

MsDecoder.prototype.getStats = function () {
  return this.invoke({
    method: 'getStats'
  });
};

MsDecoder.prototype.handleConnected = function () {
  return;
};

module.exports = MsDecoder;
