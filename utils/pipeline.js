var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits
var Kobj = require('./kobj.js')

function Pipeline(kms) {
  Pipeline.super_.call(this);

  this.kms = kms;
  this.webrtcs = new Array();
  this.plumbers = new Array();
  this.recorders = new Array();
  this.decoders = new Array();
  this.numbers = 0;
  this.rtps = new Array();
  this.hubs = new Array();
}
inherits(Pipeline, Kobj);

Pipeline.prototype.getKms = function () {
  return this.kms;
}

Pipeline.prototype.createWebRtc = function () {
  this.checkReleased();
  return null;
}

Pipeline.prototype.createRecorder = function (uri, profile) {
  return null;
}

Pipeline.prototype.createPlumber = function () {
  return null;
}

Pipeline.prototype.createRtp = function () {
  return null;
}

Pipeline.prototype.createHub = function (options) {
  return null;
}

Pipeline.prototype.getSource = function () {
  return null;
}

Pipeline.prototype.getWebrtcs = function () {
  this.checkReleased();
  return this.webrtcs;
}

Pipeline.prototype.getPlumbers = function () {
  this.checkReleased();
  return this.plumbers;
}

Pipeline.prototype.getElements = function () {
  logger.debug(__line + 'get elements : ' + this.label);
  for (var item in this.plumbers)
    logger.trace(__line + 'plumbers : ' + item + ' label ' + this.plumbers[item].label);
  for (var item in this.webrtcs)
    logger.trace(__line + 'webrtcs : ' + item + ' label ' + this.webrtcs[item].label);
  var res = [];
  for (var item in this.plumbers)
    res.push(this.plumbers[item]);
  for (var item in this.webrtcs)
    res.push(this.webrtcs[item]);
  return res;
}

Pipeline.prototype.link = function (pipeline, params) {
  this.checkReleased();
  var psrc = this.createPlumber();
  var psink = pipeline.createPlumber();
  psrc.label = this.label + '.plumber.src';
  psink.label = pipeline.label + '.plumber.sink'
  logger.debug(__line + 'pipeline link : ' + this.label + ' ' + pipeline.label);

  return psrc.link(psink, params).then(() => {
    return [psrc, psink];
  });
}

Pipeline.prototype.removeElement = function (element) {
  this.checkReleased();
  logger.debug(__line + 'Pipeline remove element ' + element.label);
  this.getElements();
  var k = this.webrtcs.indexOf(element);
  if (k >= 0) {
    this.webrtcs.splice(k, 1);
  } else {
    k = this.plumbers.indexOf(element);
    if (k >= 0) {
      this.plumbers.splice(k, 1);
    }
  }
  logger.trace(__line + 'After remove element :');
  this.getElements();
}

Pipeline.prototype.release = function () {
  logger.trace(__line + 'RELAESE PIPELINE label ' + this.label);
  var elements = this.getElements();
  for (var idx in elements) {
    var elem = elements[idx];
    elem.release();
    this.removeElement(elem);
  }
  this.getKms().removePipeline(this);
  Pipeline.super_.prototype.release.call(this);
}

module.exports = Pipeline;
