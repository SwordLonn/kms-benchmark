var logger = require('rloud-logger').logger(__filename)
//

//var Element = require('./element.js')
var inherits = require('util').inherits
var Recorder = require('../utils/recorder.js')

function LiRecorder(pipeline, uuid) {
  LiRecorder.super_.call(this, pipeline, uuid, 'Recorder');
}

inherits(LiRecorder, Recorder);

module.exports = LiRecorder;
//Recorder.prototype
