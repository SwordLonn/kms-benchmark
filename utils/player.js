var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Player(pipeline, uri) {
  Player.super_.call(this, pipeline);
  var self = this;
  this.type = 'Player';
  this.uri = uri;
  logger.debug(__line + 'create Player ' + this.label);
}

inherits(Player, Element);

Player.prototype.connect = function (element) {
  Player.super_.prototype.connect.call(this, element);
}

Player.prototype.disconnect = function () {
  Player.super_.prototype.disconnect.call(this);
}

Player.prototype.release = function () {
  Player.super_.prototype.release.call(this);
}

Player.prototype.play = function () {
  return Promise.reject('not impl.');
}

Player.prototype.stop = function () {
  return Promise.reject('not impl.');
}

Player.prototype.pause = function () {
  return Promise.reject('not impl.');
}

Player.prototype.resume = function () {
  return Promise.reject('not impl.');
}

Player.prototype.seek = function (position) {
  return Promise.reject('not impl.');
}

Player.prototype.position = function () {
  return Promise.reject('not impl.');
}

Player.prototype.info = function () {
  return Promise.reject('not impl.');
}

Player.prototype.invoke = function (params) {
  var self = this;
  logger.debug(__line + ' player invoke ');
  if (params.method == 'play') {
    return self.play();
  }
  if (params.method == 'stop') {
    return self.stop();
  }
  if (params.method == 'pause') {
    return self.pause();
  }
  if (params.method == 'resume') {
    return self.resume();
  }
  if (params.method == 'seek') {
    return self.seek(params.position);
  }
  if (params.method == 'position') {
    return self.position();
  }
  if (params.method == 'info') {
    return self.info();
  }
  return Promise.reject('not supported method : ' + params.method);
}

module.exports = Player;






