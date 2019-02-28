var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits
var LiWebRTC = require('./liwebrtc.js')
var Plumber = require('../utils/plumber.js')

function LiPlumber(pipeline, uuid) {
  LiPlumber.super_.call(this, pipeline);
  this.uuid = null;
  this.connectedQueue = new Array();
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

inherits(LiPlumber, Plumber);
LiPlumber.prototype.connect = function (element) {
  var self = this;
  LiPlumber.super_.prototype.connect.call(this, element);
  return new Promise(function (resolve, reject) {
    if (element.type == 'Player') {
      reject('connect element type error. ' + self.type + ' -> ' + element.type);
      return;
    }
    self.promise.then(function () {
      element.promise.then(function () {
        self.pipeline.connect(self, element).then(function () {
          //element.emit('_connected_');
          element.handleConnected().then(function () {
            resolve();
          }).catch(function (error) {
            reject(error);
          });
          //element.emit('_connected_');
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

LiPlumber.prototype.handleConnected = function () {
  //
  logger.info(__line + ' on connected. ');
  var self = this;
  return new Promise(function (resolve, reject) {
    //for(var idx in self.connectedQueue){
    //  self.connectedQueue[idx]();
    //  break;
    //}
    if (self.connectedQueue.length > 0) {
      self.connectedQueue[0]().then(function () {
        resolve();
      }).catch(function (error) {
        reject(error);
      });
      self.connectedQueue.length = 0;
    } else {
      resolve();
    }
  });
}

LiPlumber.prototype.processSdpOffer = function (sdpOffer) {
  //logger.info(__line + 'Plumber processSdpOffer');
  var self = this;
  return new Promise(function (resolve, reject) {
    self.promise.then(function () {
      self.invoke({
        method: 'processOffer',
        sdpOffer: sdpOffer
      }).then(function (res) {
        resolve(res.sdpAnswer)
      }).catch(function (error) {
        reject(error);
      });
    }).catch(function (error) {
      reject(error);
    });
  });
}

LiPlumber.prototype.processSdpAnswer = function (sdpAnswer) {
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

LiPlumber.prototype.gatherCandidates = function () {
  //logger.info(__line + 'Plumber gatherCandidates');
}

LiPlumber.prototype.addIceCandidate = function (candidate) {
  //logger.info(__line + 'Plumber addIceCandidate');

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

LiPlumber.prototype.createOffer = function (options) {
  logger.info(__line + 'Plumber createOffer');
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

LiPlumber.prototype.link = function (plumber) {
  LiPlumber.super_.prototype.link.call(this, plumber);
  var self = this;
  return new Promise(function (resolve, reject) {
    self.on('onIceCandidate', function (candidate) {
      plumber.addIceCandidate(candidate);
    });
    plumber.on('onIceCandidate', function (candidate) {
      self.addIceCandidate(candidate);
    });
    self.connectedQueue.push(function () {
      logger.info(__line + 'link...');
      return new Promise(function (res, rej) {
        self.createOffer().then(function (sdpOffer) {
          plumber.processSdpOffer(sdpOffer).then(function (sdpAnswer) {
            self.processSdpAnswer(sdpAnswer).then(function () {
              self.gatherCandidates();
              plumber.gatherCandidates();
              res();
            }).catch(function (error) {
              logger.info(__line + error);
              rej(error);
            });
          }).catch(function (error) {
            logger.info(__line + error);
            rej(error);
          });
        }).catch(function (error) {
          logger.info(__line + error);
          rej(error);
        });
      });
    });
    resolve();
  });
}

LiPlumber.prototype.getMediaElement = function () {
}
LiPlumber.prototype.getLinkedTo = function () {
  return this.linkedTo;
}

LiPlumber.prototype.release = function () {
  //this.releaseLink();
  var self = this;
  this.promise.then(function () {
    self.pipeline.releaseElement(self);
  }).catch(function (error) {
    logger.info(__line + error);
  });
  LiPlumber.super_.prototype.release.call(this);
}

LiPlumber.prototype.invoke = function (params) {
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

module.exports = LiPlumber;
