var logger = require('rloud-logger').logger(__filename)
var Promise = require('bluebird')
var inherits = require('util').inherits
var Hub = require('../utils/hub.js')
var KHubPort = require('./khubport.js')

var mixer = 'rcmixer';
//var mixer = 'Composite';

function KComposite(pipeline, options) {
  KComposite.super_.call(this);
  this.pipeline = pipeline;
  this.options = options;
  this.number = 0;

  this.hub = pipeline.mediaPipeline.then((pipe) => {
    return Promise.promisify(pipe.create.bind(pipe))(mixer, {
      width: options.width ? options.width : 640,
      height: options.height ? options.height : 480
    });
  });
}
inherits(KComposite, Hub);

KComposite.prototype.createHubPort = function (options) {
  var port = new KHubPort(this, options);
  port.label = `port.${this.number}`;
  this.number++;
  this.ports[port.label] = port;
  return port;
}

KComposite.prototype.releasePort = function (label) {
  var port = this.ports[label];
  if (port) {
    delete this.ports[label];
    port.release();
  }
}

KComposite.prototype.release = function () {
  while (this.ports.length > 0) {
    var port = this.ports.shift();
    port.release();
  }
  this.hub.then((composite) => {
    composite.release();
  });
  KComposite.super_.prototype.release.call(this);
}

module.exports = KComposite;
