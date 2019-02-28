var logger = require('rloud-logger').logger(__filename)
var url = require('url')
var http = require('http')
var Promise = require('bluebird')
var inherits = require('util').inherits
var Ims = require('../utils/ims.js')
//var Pipeline = require('./pipeline.js')
//var WebRTC = require('./webrtc.js')
//var Recorder = require('./recorder.js')
//var Player = require('./player.js')
//var Plumber = require('./plumber.js')

var RpcBuilder = require('kurento-jsonrpc');

function LiMSClient(uri) {
  LiMSClient.super_.call(this, uri);
  this.uri = uri;
  this.pipelines = {};
  this.queue = new Array();
  var self = this;
  var config = {
    heartbeat: 3000,
    sendCloseMessage: true,
    ws: {
      uri: uri,
      useSockJS: false,
      onconnected: function () {
        logger.info(__line + 'tree client connected.');
        self.state = 'connected';
        self.sendRequests();
      },
      ondisconnect: function () {
        self.state = 'disconnected';
        logger.info(__line + 'tree client disconnected.');
      },
      onreconnecting: function () {
        self.state = 'connecting';
        logger.info(__line + 'tree client reconnecting.');
      },
      onreconnected: function () {
        self.state = 'connected';
        logger.info(__line + 'tree client reconnected.');
        self.sendRequests();
      },
    },
    rpc: {
      requestTimeout: 15000,
      onEvent: function (request) {
        logger.info(__line + 'request ' + request);
        self.processEvent(request);
      },
    }
  };

  this.jsonrpcClient = new RpcBuilder.clients.JsonRpcClient(config);
  logger.info(__line + 'connect .');
}

inherits(LiMSClient, Ims);

LiMSClient.prototype.processEvent = function (event) {
  var pipeline = this.pipelines[event.pipeline];
  pipeline.processEvent(event);
}

LiMSClient.prototype.clearRequests = function () {
  for (var i = 0; i < this.queue.length; i++) {
    var request = this.queue[i].request;
    var callback = this.queue[i].callback;
    clearInterval(this.queue[i].timer);
    callback('queue time out.');
  }
  this.queue.length = 0;
}

LiMSClient.prototype.queueRequest = function (request, callback) {
  var self = this;
  if (self.state != 'connected') {
    this.queue.push({ request: request, callback: callback, timer: setTimeout(function () { self.clearRequests() }, 5000) });
  } else {
    //clearInterval()
    logger.info(__line + 'callback');
    this.jsonrpcClient.send(request.method, request.params, callback);
  }
}

LiMSClient.prototype.sendRequests = function () {
  for (var i = 0; i < this.queue.length; i++) {
    var request = this.queue[i].request;
    var callback = this.queue[i].callback;
    clearInterval(this.queue[i].timer);
    logger.info(__line + callback);
    this.jsonrpcClient.send(request.method, request.params, callback);
  }
  this.queue.length = 0;
}

LiMSClient.prototype.createPipeline = function () {
  //
  var self = this;
  return new Promise(function (resolve, reject) {
    self.queueRequest({
      method: "createPipeline",
      params: {}
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        //var pipe = new Pipeline(self, response.pipeline);
        //self.pipelines[pipe.uuid] = pipe;
        resolve(response.pipeline);
      }
    });
  });
}

LiMSClient.prototype.createElement = function (pipeline, type, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    params = params || {};
    params.type = type;
    params.pipeline = pipeline.uuid;
    self.queueRequest({
      method: "createElement",
      params: params
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        //var element = pipeline.createElement(type, response.element);
        resolve(response.element);
      }
    });
  });
}

LiMSClient.prototype.releasePipeline = function (pipeline) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.queueRequest({
      method: "releasePipeline",
      params: {
        pipeline: pipeline.uuid
      }
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        //delete self.pipelines[pipeline.uuid];
        resolve();
      }
    });
  });
}

LiMSClient.prototype.releaseElement = function (element) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.queueRequest({
      method: "releaseElement",
      params: {
        pipeline: element.pipeline.uuid,
        element: element.uuid
      }
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        //element.pipeline.releaseElement(element);
        resolve();
      }
    });
  });
}

LiMSClient.prototype.connect = function (srcElement, dstElement) {
  var self = this;
  return new Promise(function (resolve, reject) {
    self.queueRequest({
      method: "connect",
      params: {
        pipeline: srcElement.pipeline.uuid,
        srcElement: srcElement.uuid,
        dstElement: dstElement.uuid
      }
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        resolve();
      };
    });
  });
}

LiMSClient.prototype.invoke = function (element, params) {
  var self = this;
  return new Promise(function (resolve, reject) {
    params.pipeline = element.pipeline.uuid;
    params.element = element.uuid;
    self.queueRequest({
      method: "invoke",
      params: params
    }, function (error, response) {
      if (error)
        reject(error);
      else {
        resolve(response);
      }
    });
  });
}

module.exports = LiMSClient;
