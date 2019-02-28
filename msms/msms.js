var logger = require('rloud-logger').logger(__filename)
var inherits = require('util').inherits
var MsPipeline = require('./mspipeline.js')
var Ims = require('../utils/ims.js')
var MsmsClient = require('./msmsclient')
var url = require('url')

function getType(uri) {
  try {
    var p = url.parse(uri).path;
    var idx = p.indexOf('?');
    return p.substring(1, idx > 0 ? idx : undefined);
  } catch (except) {
    logger.error(except);
  }
}

function Msms(uri) {
  var client = new MsmsClient(uri);
  Msms.super_.call(this, uri, client);

  this.uuidPipelines = {};

  this.supported = {
    transport: true,
    transcode: false,
    record: false,
    mix: false,
    play: false,
    analyze: false,
  };

  var type = getType(uri);
  if (type == 'mems') {
    this.supported['analyze'] = true;
  }

  var self = this;

  client.on('event', function (event) {
    var uuid = event.pipeline;

    var pipeline = self.uuidPipelines[uuid];
    if (pipeline) {
      pipeline.processEvent(event);
    }
  });

  client.on('disconnect', function () {
    self.emit('disconnect');
  });
}

inherits(Msms, Ims);

Msms.prototype.createPipeline = function () {
  logger.debug(__line + 'create pipeline.');
  var pipeline = new MsPipeline(this);
  var self = this;
  pipeline.on('addUuidPipeline', (uuid) => {
    if (self.uuidPipelines[uuid])
      logger.warn(__line + 'pipeline exist ' + uuid);
    self.uuidPipelines[uuid] = pipeline
  });

  pipeline.on('clearUuidPipeline', (uuid) => {
    delete self.uuidPipelines[uuid];
  });

  pipeline.label = this.label + '.pipeline.' + this.number;
  this.number++;
  this.pipelines[pipeline.label] = pipeline;
  return pipeline;
}

Msms.prototype.support = function (domain) {
  return !domain || this.supported[domain];
}

module.exports = Msms;
