var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr

var inherits = require('util').inherits
var Kobj = require('./kobj.js')
var Promise = require('bluebird')

function Element(pipeline) {
  Element.super_.call(this);
  logger.debug(__line + 'create element ' + pipeline);
  this.pipeline = pipeline;
  this.sinks = new Array();
  this.source = null;
  this.label = null;
  this.collector = null;
  this.marker = {};
}

inherits(Element, Kobj);

Element.prototype.collectStats = function (interval) {
  var self = this;
  this.collector = setInterval(function () {
    self.getStats().then(function (stats) {
      self.emit('stats', stats);
    }).catch(function (error) {
      self.emit('stats-error', error);
      self.pipeline.emit('stats-error', self, error);
      logger.warn(__line + ' get element ' + self.label + ' stats error : ' + strerr(error));
    });
  }, interval);
}

Element.prototype.getStats = function () {
  return Promise.resolve({});
}

Element.prototype.connect = function (element) {
  this.checkReleased();
  logger.debug(__line + 'element : ' + element.label);
  logger.debug(__line + 'this : ' + this.label);
  if (this.getPipeline().label != element.getPipeline().label) {
    throw 'elements ' + this.label + ',' + element.label + ' not at same pipeline.'
  }
  this.sinks.push(element);
  element.setSource(this);
}

Element.prototype.disconnect = function () {
  this.checkReleased();
  if (this.source != null) {
    logger.debug(__line + 'disconnect ' + this.label + ' with ' + this.source.label);
    var k = this.source.sinks.indexOf(this);
    if (k >= 0) {
      logger.debug(__line + 'disconnect ' + this.source.sinks[k].label);
      this.source.sinks.splice(k, 1);
    }
  }
  this.source = null;
}

Element.prototype.setSource = function (source) {
  this.checkReleased();
  this.source = source;
}

Element.prototype.handleConnected = function () {
  return Promise.resolve();
}

Element.prototype.getSinks = function () {
  this.checkReleased();
  return this.sinks;
}

Element.prototype.getPipeline = function () {
  this.checkReleased();
  logger.debug(__line + 'pipeline : ' + this.pipeline);
  return this.pipeline;
}

Element.prototype.getSource = function () {
  this.checkReleased();
  return this.source;
}

Element.prototype.release = function () {
  if (this.collector) {
    clearInterval(this.collector);
    this.collector = null;
  }
  logger.debug(__line + 'Element release ' + this.label);
  if (this.source)
    logger.debug(__line + ' source ' + this.source.label);
  else
    logger.debug(__line + ' source null');
  this.disconnect();
  for (var k in this.sinks) {
    this.sinks[k].disconnect();
  }
  this.pipeline.removeElement(this);
  Element.super_.prototype.release.call(this);
}

module.exports = Element;
