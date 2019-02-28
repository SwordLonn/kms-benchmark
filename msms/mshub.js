var logger = require('rloud-logger').logger(__filename);
//
var inherits = require('util').inherits;
var Hub = require('../utils/mhub.js');
var Promise = require('bluebird');

function MsHub(pipeline, properties) {
  MsHub.super_.call(this, pipeline);
  this.uuid = null;
  this.properties = this;

  var self = this;

  self.promise = self.pipeline.
    createElement('Hub', { properties: properties }).then((uuid) => {
      self.uuid = uuid;
    });
}

inherits(MsHub, Hub);

MsHub.prototype.addParser = function (properties) {
  return this.invoke({
    method: 'addParser',
    properties: properties
  }).then((res) => {
    return res;
  })
};

MsHub.prototype.changeMosaic = function(mosaicType) {
  return this.invoke({
    method: 'changeMosaic',
    mosaicType: mosaicType,
  })
};

MsHub.prototype.connect = function (elem, parserId) {
  var self = this;
  if (elem.type !== 'WebRTC' && elem.type !== 'RTP' &&
    elem.type !== 'Plumber' && elem.type !== 'PassThrough') {
    return Promise.reject(`Hub connect not support element type ${webrtc.type}`);
  }

  MsHub.super_.prototype.connect.call(this, elem);
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

MsHub.prototype.release = function () {
  this.pipeline.releaseElement(this);
  MsHub.super_.prototype.release.call(this);
};

MsHub.prototype.invoke = function (params) {
  var self = this;
  return this.promise.then(() => {
    return self.pipeline.invoke(self, params);
  });
};

MsHub.prototype.getStats = function () {
  return this.invoke({
    method: 'getStats'
  });
};

module.exports = MsHub;
