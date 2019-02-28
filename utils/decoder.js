var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits

var Element = require('./element.js')

function Decoder(pipeline, properties) {
  Decoder.super_.call(this, pipeline);
  this.type = 'Decoder';
}

inherits(Decoder, Element);

Decoder.prototype.addParser = function () {
  logger.debug(__line + 'Add parser');
};

Decoder.prototype.release = function () {
  logger.debug(__line + 'Decoder release');
  Decoder.super_.prototype.release.call(this);
};

Decoder.prototype.connect = function (element) {
  Decoder.super_.prototype.connect.call(this, element);
};

Decoder.prototype.disconnect = function (element) {
  Decoder.super_.prototype.disconnect.call(this, element);
};

module.exports = Decoder;
