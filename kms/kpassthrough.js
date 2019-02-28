var logger = require('rloud-logger').logger(__filename)
var Promise = require('bluebird')
var inherits = require('util').inherits
var getBitrateOfSdp = require('rloud-utils').sdphelper.getBitrateOfSdp
var PassThrough = require('../utils/passthrough.js')


function KPassThrough(pipeline) {
  KPassThrough.super_.call(this, pipeline);
  var self = this;
  this.endpoint = pipeline.mediaPipeline.then((pipe) => {
    return Promise.promisify(pipe.create.bind(pipe))('PassThrough').then((point) => {
      point.on('MediaFlowOutStateChange', (event) => {
        logger.trace(`${__line} ${self.label} type ${self.type} ${JSON.stringify(event)}`);
      });
      point.on('MediaFlowInStateChange', (event) => {
        logger.trace(`${__line} ${self.label} type ${self.type} ${JSON.stringify(event)}`);
      });
      return point;
    });
  });
}

inherits(KPassThrough, PassThrough);

KPassThrough.prototype.getMediaElement = function () {
  return this.endpoint;
}

KPassThrough.prototype.release = function () {
  if (this.endpoint) {
    this.endpoint.then((point) => {
      point.release();
    });
    this.endpoint = null;
  }
  KPassThrough.super_.prototype.release.call(this);
}

KPassThrough.prototype.disconnect = function () {
  KPassThrough.super_.prototype.disconnect.call(this);
}

KPassThrough.prototype.connect = function (element) {
  KPassThrough.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}

module.exports = KPassThrough;
