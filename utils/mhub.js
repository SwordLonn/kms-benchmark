var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Hub(pipeline, properties) {
  Hub.super_.call(this, pipeline);
  this.type = 'Hub';
}

inherits(Hub, Element);

Hub.prototype.changeMosaic = function () {
  logger.debug(__line + 'Change mosaic');
};

Hub.prototype.release = function () {
  logger.debug(__line + 'Hub release');
  Hub.super_.prototype.release.call(this);
};

Hub.prototype.connect = function (element) {
  Hub.super_.prototype.connect.call(this, element);
};

Hub.prototype.disconnect = function (element) {
  Hub.super_.prototype.disconnect.call(this, element);
};

module.exports = Hub;
