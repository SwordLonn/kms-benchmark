var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var Promise = require('bluebird')
var inherits = require('util').inherits
var Pipeline = require('../utils/pipeline.js')
var Kobj = require('../utils/kobj.js')
var KWebrtc = require('./kwebrtc.js')
var KPlumber = require('./kplumber.js')
var KRtpPlumber = require('./krtpplumber.js')
var KRecorder = require('./krecorder.js')
var KRtp = require('./krtp.js')
var KComposite = require('./kcomposite.js')
var KPassThrough = require('./kpassthrough.js')
var KPlayer = require('./kplayer.js')

var use_webrtc = true;

function KPipeline(kms) {
  KPipeline.super_.call(this, kms);
  this.source = null;
  this.mediaPipeline = Promise.promisify(kms.client.create, kms.client)('MediaPipeline');
  this.mediaPipeline.then(function (pipe) {
  });
}
inherits(KPipeline, Pipeline);

KPipeline.prototype.getSource = function () {
  if (!this.source) {
    this.source = new KPassThrough(this);
    this.source.label = this.label + '.passthrough';
  }
  return this.source;
}

KPipeline.prototype.createWebRtc = function () {
  this.checkReleased();
  var webrtc = new KWebrtc(this);
  var self = this;
  webrtc.on('onStateChanged', function (event) {
    self.emit('onStateChanged', self, webrtc, event);
  });
  this.webrtcs.push(webrtc);
  return webrtc;
}

KPipeline.prototype.createRecorder = function (uri, profile) {
  this.checkReleased();
  var recorder = new KRecorder(this, uri, profile);
  var self = this;
  recorder.label = this.label + ".recorder." + uri;
  this.recorders.push(recorder);
  return recorder;
}

KPipeline.prototype.createPlumber = function (internal) {
  this.checkReleased();
  var plumber = null;
  if (use_webrtc || !internal)
    plumber = new KPlumber(this);
  else
    plumber = new KRtpPlumber(this);
  plumber.label = this.label + ".plumber." + this.numbers;
  this.numbers++;
  var self = this;
  plumber.on('onStateChanged', function (event) {
    self.emit('onStateChanged', self, plumber, event);
  });
  this.plumbers.push(plumber);
  return plumber;
}

KPipeline.prototype.createPlayer = function (uri) {
  this.checkReleased();
  var player = new KPlayer(this, uri);
  player.label = this.label + '.player';
  return player;
}

KPipeline.prototype.createRtp = function () {
  this.checkReleased();
  var rtp = new KRtp(this);
  rtp.label = this.label + ".rtp." + this.numbers;
  this.numbers++;
  this.rtps.push(rtp);
  return rtp;
}

KPipeline.prototype.createHub = function (options) {
  this.checkReleased();
  var composite = new KComposite(this, options);
  composite.label = this.label + '.composite.' + this.numbers;
  this.numbers++;
  this.hubs.push(composite);
  return composite;
}

KPipeline.prototype.release = function () {
  var self = this;
  logger.debug(__line + ' kms pipeline release');
  KPipeline.super_.prototype.release.call(this);
  if (self.source) {
    self.source.release();
  }
  self.mediaPipeline.then(function (pipeline) {
    logger.debug(__line + ' kms pipeline object release');
    pipeline.release();
  }).catch(function (error) {
    logger.debug(__line + ' kms pipeline error ' + strerr(error));
  });
}

module.exports = KPipeline;
