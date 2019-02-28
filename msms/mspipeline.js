var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var inherits = require('util').inherits;
var MsWebRTC = require('./mswebrtc.js');
var MsDecoder = require('./msdecoder.js');
var MsHub = require('./mshub.js');
var MsPlumber = require('./msplumber.js');
var Promise = require('bluebird');
var Pipeline = require('../utils/pipeline.js');
var MsPassThrough = require('./mspassthrough');
var MsRTP = require('./msrtp');

function MsPipeline(msms) {
  MsPipeline.super_.call(this, msms);
  this.msms = msms;
  this.uuid = null;
  var self = this;
  this.elements = {};
  this.passThrough = new MsPassThrough(this);

  this.mediaPipeline = self.msms.client.createPipeline().then((uuid) => {
    self.uuid = uuid;
    self.emit('addUuidPipeline', uuid);
    return self;
  }).catch((error) => {
    logger.error(__line + ' createPipeline error ' + error);
  });
}
inherits(MsPipeline, Pipeline);

MsPipeline.prototype.createWebRtc = function () {
  this.checkReleased();
  var webrtc = new MsWebRTC(this);
  webrtc.label = this.label + '.webrtc.' + this.numbers;
  this.numbers++;
  var self = this;
  webrtc.on('onStateChange', function (event) {
    self.emit('onStateChanged', self, webrtc, event);
  });

  webrtc.promise.then(function () {
    self.elements[webrtc.uuid] = webrtc;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });
  this.webrtcs.push(webrtc);
  return webrtc;
}

MsPipeline.prototype.createDecoder = function (properties) {
  var self = this;
  this.checkReleased();
  var decoder = new MsDecoder(this, properties);
  decoder.label = this.label + '.decoder.' + this.numbers;
  this.numbers++;

  decoder.promise.then(function () {
    self.elements[decoder.uuid] = decoder;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });
  this.decoders.push(decoder);
  return decoder;
}

MsPipeline.prototype.createHub = function (properties) {
  var self = this;
  this.checkReleased();
  var hub = new MsHub(this, properties);
  hub.label = this.label + '.decoder.' + this.numbers;
  this.numbers++;

  hub.promise.then(function () {
    self.elements[hub.uuid] = hub;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });
  this.hubs.push(hub);
  return hub;
}



MsPipeline.prototype.createRtp = function () {
  this.checkReleased();
  var rtp = new MsRTP(this);
  rtp.label = this.label + '.rtp.' + this.numbers;
  this.numbers++;
  var self = this;
  rtp.promise.then(function () {
    self.elements[rtp.uuid] = rtp;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });

  this.rtps.push(rtp);
  return rtp;
}

MsPipeline.prototype.createRecorder = function () {
  this.checkReleased();
  var recorder = new MsRecorder(this, uri);
  recorder.label = this.label + '.recorder.' + this.numbers;
  this.numbers++;
  var self = this;
  recorder.promise.then(function () {
    self.elements[recorder.uuid] = recorder;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });
  recorder.label = this.label + ' ' + uri;
  this.recorders.push(recorder);
  return recorder;
}

MsPipeline.prototype.createPlumber = function () {
  this.checkReleased();
  var plumber = new MsPlumber(this);
  plumber.label = this.label + '.plumber.' + this.numbers;
  this.numbers++;
  var self = this;
  plumber.on('onStateChange', function (event) {
    self.emit('onStateChanged', self, plumber, event);
  });
  plumber.promise.then(function () {
    self.elements[plumber.uuid] = plumber;
  }).catch(function (error) {
    logger.error(`${__line} error ${strerr(error)}`);
  });
  this.plumbers.push(plumber);
  return plumber;
}

MsPipeline.prototype.processEvent = function (event) {
  var element = this.elements[event.element];
  if (element)
    element.emit(event.type, event.data);
}

MsPipeline.prototype.createElement = function (type, params) {
  var self = this;
  return self.mediaPipeline.then((pipe) => {
    var ctype = type;
    if (type == 'Plumber')
      ctype = 'WebRTC';
    return self.msms.client.createElement(self, ctype, params);
  });
}

MsPipeline.prototype.releaseElement = function (element) {
  var self = this;
  return self.mediaPipeline.then((pipe) => {
    return self.msms.client.releaseElement(element);
  }).then(() => {
    delete self.elements[element.uuid];
  }).catch((error) => {
    logger.warn(`${__line} release Element error`);
  });
}

MsPipeline.prototype.getElements = function () {
  var list = MsPipeline.super_.prototype.getElements.call(this);
  var elems = [];
  Object.entries(this.elements).map((it) => {
    elems.push(it[1]);
  });
  return list.concat(elems);
}

MsPipeline.prototype.release = function () {
  var self = this;
  this.emit('clearUuidPipeline', this.uuid);
  MsPipeline.super_.prototype.release.call(this);
  self.mediaPipeline.then(function (pipeline) {
    return self.msms.client.releasePipeline(self);
  }).catch(function (error) {
    logger.warn(`${__line} release error ${strerr(error)}`);
  });
}

MsPipeline.prototype.getSource = function () {
  return this.passThrough;
}

MsPipeline.prototype.connect = function (src, dst, parserId) {
  var self = this;
  if (src.pipeline != dst.pipeline) {
    return Promise.reject('elements not at same pipeline');
  }
  if (src.pipeline != self) {
    return Promise.reject('elements not at pipeline.');
  }
  return self.msms.client.connect(src, dst, parserId);
}

MsPipeline.prototype.invoke = function (element, params) {
  var self = this;
  return self.mediaPipeline.then((pipe) => {
    return self.msms.client.invoke(element, params);
  });
}

MsPipeline.prototype.getDecoder = function() {
  if (this.decoders.length == 0) {
    return undefined;
  }
  let decoder = this.decoders[this.decoders.length - 1];
  if (decoder.released) {
    return undefined;
  }
  return decoder;
}

module.exports = MsPipeline;
