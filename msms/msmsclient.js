var logger = require('rloud-logger').logger(__filename);
var Promise = require('bluebird');
var inherits = require('util').inherits;
var Ims = require('../utils/ims.js');

var RpcWrapper = require('rloud-utils').jsonrpcwrapper;

function MsmsClient(uri) {
  MsmsClient.super_.call(this, uri);
  logger.debug('MsmsClient constructor() connect to ' + uri);
  this.uri = uri;
  var self = this;
  var config = {
    requestTimeout: 15000,
    onEvent: function (request) {
      logger.trace(__line + 'request:', JSON.stringify(request));
      self.processEvent(request);
    },
  };
  this.client = new RpcWrapper(config, uri);
  this.client.on('disconnect', () => {
    self.emit('disconnect');
  });
}

inherits(MsmsClient, Ims);

MsmsClient.prototype.processEvent = function (event) {
  this.emit('event', event);
};

MsmsClient.prototype.createPipeline = function () {
  return this.client.request({
    method: 'createPipeline',
    params: {}
  }).then((response) => {
    return response.pipeline;
  });
}

MsmsClient.prototype.createElement = function (pipeline, type, params) {
  params = params || {};
  params.type = type;
  params.pipeline = pipeline.uuid;
  return this.client.request({
    method: 'createElement',
    params: params
  }).then((response) => {
    return response.element;
  });
}

MsmsClient.prototype.releasePipeline = function (pipeline) {
  var self = this;
  return self.client.request({
    method: 'releasePipeline',
    params: {
      pipeline: pipeline.uuid
    }
  });
}

MsmsClient.prototype.releaseElement = function (element) {
  return this.client.request({
    method: 'releaseElement',
    params: {
      pipeline: element.pipeline.uuid,
      element: element.uuid,
    }
  });
}

MsmsClient.prototype.connect = function (src, dst, parserId) {
  let params = {
    pipeline: src.pipeline.uuid,
    srcElement: src.uuid,
    dstElement: dst.uuid
  };
  if (parserId) {
    params.parserId = parserId;
  }
  return this.client.request({
    method: 'connect',
    params: params,
  });
}

MsmsClient.prototype.invoke = function (element, params) {
  params.pipeline = element.pipeline.uuid;
  params.element = element.uuid;
  return this.client.request({
    method: 'invoke',
    params: params
  });
}

module.exports = MsmsClient;
