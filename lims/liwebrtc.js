var logger = require('rloud-logger').logger(__filename)
//
var inherits = require('util').inherits
var Webrtc = require('../utils/webrtc.js')
var Promise = require('bluebird')

function LiWebRTC(pipeline) {
  LiWebRTC.super_.call(this, pipeline);
  this.uuid = null;

  var self = this;
  this.promise = new Promise(function (resolve, reject) {
    self.pipeline.mediaPipeline.then(function (pipeline) {
      self.pipeline.createElement('WebRTC', null).then(function (uuid) {
        self.uuid = uuid;
        resolve();
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

inherits(LiWebRTC, Webrtc);

LiWebRTC.prototype.createOffer = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      self.invoke({
        method: 'generateOffer'
      }).then(function (res) {
        resolve(res.sdpOffer);
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiWebRTC.prototype.processSdpAnswer = function (sdpAnswer) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      self.invoke({
        method: 'processAnswer',
        sdpAnswer: sdpAnswer
      }).then(function (res) {
        resolve();
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiWebRTC.prototype.processSdpOffer = function (sdpOffer) {
  var self = this;
  logger.info(__line + 'LiWebRTC process sdp offer');
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      self.invoke({
        method: 'processOffer',
        sdpOffer: sdpOffer
      }).then(function (res) {
        resolve(res.sdpAnswer);
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiWebRTC.prototype.addIceCandidate = function (candidate) {
  var self = this;
  logger.info(__line + 'LiWebRTC addIceCandidate');
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      logger.info(__line + 'internal promise addIceCandidate');
      self.invoke({
        method: 'addIceCandidate',
        candidate: candidate
      }).then(function (res) {
        logger.info(__line + 'resolve');
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

LiWebRTC.prototype.gatherCandidates = function () {
  logger.info(__line + 'Webrtc gatherCandidates');
}


LiWebRTC.prototype.connect = function (element) {
  var self = this;
  LiWebRTC.super_.prototype.connect.call(this, element);
  return new Promise(function (resolve, reject) {
    if (element.type == 'Player') {
      reject('connect element type error. ' + self.type + ' -> ' + element.type);
      return;
    }
    self.promise.then(function () {
      element.promise.then(function () {
        self.pipeline.connect(self, element).then(function () {
          element.handleConnected().then(function () {
            resolve();
          }).catch(function (error) {
            reject(error);
          });
        }).catch(function (error) {
          reject(error);
        });
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiWebRTC.prototype.release = function () {
  var self = this;
  this.promise.then(function () {
    self.pipeline.releaseElement(self);
  }).catch(function (error) {
    logger.info(__line + error);
  });
  LiWebRTC.super_.prototype.release.call(this);
}
LiWebRTC.prototype.invoke = function (params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      self.pipeline.invoke(self, params).then(function (res) {
        resolve(res);
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

module.exports = LiWebRTC;
