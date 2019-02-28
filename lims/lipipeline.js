var logger = require('rloud-logger').logger(__filename)
//
var inherits = require('util').inherits
var LiWebRTC = require('./liwebrtc.js')
var LiRecorder = require('./lirecorder.js')
//var Player = require('./player.js')
var LiPlumber = require('./liplumber.js')
//var Element = require('./element.js')
var Promise = require('bluebird')
var Pipeline = require('../utils/pipeline.js')

function LiPipeline(lims) {
  LiPipeline.super_.call(this, lims);
  this.lims = lims;
  this.uuid = null;
  var self = this;
  this.elements = {}
  this.mediaPipeline = new Promise(function (resolve, reject) {
    self.lims.client.createPipeline().then(function (pipeline) {
      logger.info(__line + 'created pipeline ' + pipeline);
      self.uuid = pipeline;
      resolve();
    }).catch(function (error) {
      reject(error);
    });
  });
}

inherits(LiPipeline, Pipeline);

LiPipeline.prototype.createWebRtc = function () {
  this.checkReleased();
  var webrtc = new LiWebRTC(this);
  var self = this;
  webrtc.promise.then(function () {
    self.elements[webrtc.uuid] = webrtc;
  }).catch(function (error) {
    logger.info(__line + error);
  });
  this.webrtcs.push(webrtc);
  return webrtc;
}

LiPipeline.prototype.createRecorder = function () {
  this.checkReleased();
  var recorder = new LiRecorder(this, uri);
  var self = this;
  recorder.promise.then(function () {
    self.elements[recorder.uuid] = recorder;
  }).catch(function (error) {
    logger.info(__line + error);
  });
  recorder.label = this.label + '.recorder.' + uri;
  this.recorders.push(recorder);
  return recorder;
}

LiPipeline.prototype.createPlumber = function () {
  this.checkReleased();
  var plumber = new LiPlumber(this);
  plumber.label = this.label + ".plumber." + this.numbers;
  this.numbers++;
  var self = this;
  plumber.promise.then(function () {
    self.elements[plumber.uuid] = plumber;
  }).catch(function (error) {
    logger.info(__line + error);
  });
  this.plumbers.push(plumber);
  return plumber;
}

LiPipeline.prototype.processEvent = function (event) {
  var element = this.elements[event.element];
  if (element)
    element.emit(event.type, event.data);
}
//
LiPipeline.prototype.createElement = function (type, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.mediaPipeline.then(function (pipeline) {
      var ctype = type;
      if (type == 'Plumber')
        ctype = 'WebRTC';
      self.lims.client.createElement(self, ctype, params).then(function (uuid) {
        var element = null;
        resolve(uuid);
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiPipeline.prototype.releaseElement = function (element) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.mediaPipeline.then(function (pipeline) {
      self.lims.client.releaseElement(element).then(function () {
        delete self.elements[element.uuid];
        resolve();
      }).catch(function (error) {
        logger.info(__line + error);
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiPipeline.prototype.release = function () {
  var self = this;
  LiPipeline.super_.prototype.release.call(this);
  self.mediaPipeline.then(function (pipeline) {
    self.lims.client.releasePipeline(self);
  });
}

LiPipeline.prototype.connect = function (srcElement, dstElement) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.mediaPipeline.then(function (pipeline) {
      if (srcElement.pipeline != dstElement.pipeline) {
        reject('elements not at same pipeline');
        return;
      }
      if (srcElement.pipeline != self) {
        reject('elements not at pipeline.');
        return;
      }
      self.lims.client.connect(srcElement, dstElement).then(function () {
        resolve();
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiPipeline.prototype.invoke = function (element, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.mediaPipeline.then(function (pipeline) {
      self.lims.client.invoke(element, params).then(function (res) {
        resolve(res);
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    })
  });
}

module.exports = LiPipeline;
