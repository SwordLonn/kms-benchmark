var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var inherits = require('util').inherits
var Promise = require('bluebird')
var Player = require('../utils/player.js')

function KPlayer(pipeline, uri, profile) {
  KPlayer.super_.call(this, pipeline);
  var self = this;
  this.uri = uri;
  this.gotinfo = false;
  this.profile = profile;
  logger.debug(__line + 'create KPlayer ' + this.label);
  this.endpoint = pipeline.mediaPipeline.then(function (pipe) {
    return Promise.promisify(pipe.create, pipe)('PlayerEndpoint', {
      uri: uri,
      useEncodedMedia: true
    });
  }).then(function (point) {
    logger.debug(__line + ' create player endpoint success.');
    point.on('EndOfStream', function (event) {
      self.emit('playEnd', event);
    });
    point.on('MediaFlowOutStateChange', function (event) {
      if (!self.gotinfo) {
        self.gotinfo = true;
        Promise.promisify(point.getVideoInfo, point)().then(function (result) {
          self.emit('info', result);
        }).catch(function (error) {
          logger.error(__line + ' get player video info error : ' + strerr(error));
          self.emit('playError', ' get player video info error : ' + strerr(error));
        });
      }
      self.emit('playerStateChanged', event);
    });
    point.on('Error', function (event) {
      self.emit('playError', event);
    });
    return point;
  });
  this.endpoint.then(function () {
    logger.debug(__line + ' just for test.');
  });
}

inherits(KPlayer, Player);

KPlayer.prototype.play = function () {
  logger.debug(__line + ' kplayer play');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.play, point)();
  });
}

KPlayer.prototype.stop = function () {
  logger.debug(__line + ' kplayer stop');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.stop, point)();
  });
}

KPlayer.prototype.pause = function () {
  logger.debug(__line + ' kplayer pause');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.pause, point)();
  });
}

KPlayer.prototype.resume = function () {
  logger.debug(__line + ' kplayer resume');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.play, point)();
  });
}

KPlayer.prototype.seek = function (position) {
  logger.debug(__line + ' kplayer seek');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.setPosition, point)(position);
  });
}

KPlayer.prototype.position = function () {
  logger.debug(__line + ' kplayer get position');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.getPosition, point)();
  });
}

KPlayer.prototype.info = function () {
  logger.debug(__line + ' kplayer get info');
  return this.endpoint.then(function (point) {
    return Promise.promisify(point.getVideoInfo, point)();
  });
}

KPlayer.prototype.release = function () {
  logger.debug(__line + ' kplayer release ');
  this.endpoint.then(function (point) {
    point.release();
  }).catch(function (error) {
    logger.error(__line + strerr(error));
  });
  KPlayer.super_.prototype.release.call(this);
}

KPlayer.prototype.connect = function (element) {
  logger.debug(__line + 'element : ' + element.label);
  logger.debug(__line + 'this : ' + this.label);
  KPlayer.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}

module.exports = KPlayer;
