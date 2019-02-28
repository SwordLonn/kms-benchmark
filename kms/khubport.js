var logger = require('rloud-logger').logger(__filename)
var Promise = require('bluebird')
var inherits = require('util').inherits
var HubPort = require('../utils/hubport.js')

function KHubPort(hub, options) {
  KHubPort.super_.call(this, hub);
  this.options = options;
  this.released = false;
  this.endpoint = hub.hub.then((composite) => {
    return Promise.promisify(composite.createHubPort.bind(composite))().then((port) => {
      if (options.type == 'src' && options.width && options.height && composite.setPortSize) {
        composite.setPortSize(port, options.width, options.height);
      }
      return port;
    });
  });
}

inherits(KHubPort, HubPort);

KHubPort.prototype.release = function () {
  if (!this.released) {
    this.releasedd = true;
    this.endpoint.then((port) => {
      port.release();
    });
  }
  this.hub.releasePort(this.label);
  KHubPort.super_.prototype.release.call(this);
}

KHubPort.prototype.connect = function (element) {
  KHubPort.super_.prototype.connect.call(this, element);
  var self = this;
  return Promise.all([
    self.endpoint,
    element.endpoint
  ]).then((points) => {
    return points[0].connect(points[1]);
  });
}

module.exports = KHubPort;
