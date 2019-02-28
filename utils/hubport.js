var logger = require('rloud-logger').logger(__filename)
var inherits = require('util').inherits
var Element = require('./element.js')

function HubPort(hub, label) {
  HubPort.super_.call(this, hub.pipeline, label);
  this.hub = hub;
}

inherits(HubPort, Element);

//HubPort.prototype.release = function(){
//
//}

module.exports = HubPort;
