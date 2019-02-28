var logger = require('rloud-logger').logger(__filename)
var strerr = require('rloud-logger').strerr
var Promise = require('bluebird')
var inherits = require('util').inherits

var Recorder = require('../utils/recorder.js')

function KRecorder(pipeline, uri, profile) {
  KRecorder.super_.call(this, pipeline);
  var self = this;
  this.uri = uri;
  this.profile = profile;
  logger.debug(__line + 'create KRecorder ' + this.label);

  this.endpoint = pipeline.mediaPipeline.then((pipe) => {
    return Promise.promisify(pipe.create.bind(pipe))('RecorderEndpoint', {
      uri: uri,
      mediaProfile: profile ? profile : undefined
    });
  });
}

inherits(KRecorder, Recorder);

KRecorder.prototype.record = function () {
  return this.endpoint.then((point) => {
    return point.record();
  });
}

KRecorder.prototype.release = function () {
  this.endpoint.then((point) => {
    point.release();
  }).catch((error) => {
    logger.error(__line + strerr(error));
  });
  KRecorder.super_.prototype.release.call(this);
}

KRecorder.prototype.connect = function (element) {
  logger.debug(`${__line} element : ${element.label}`);
  logger.debug(`${__line} this : ${this.label}`);
  KRecorder.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}

module.exports = KRecorder;
