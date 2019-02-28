var logger = require('rloud-logger').logger(__filename);
var inherits = require('util').inherits;
var RTP = require('../utils/rtp.js');

function MsRTP(pipeline) {
  MsRTP.super_.call(this, pipeline);
  logger.debug('MsRTP constructor()');
  this.uuid = null;

  var self = this;

  this.promise = self.pipeline.createElement('RTP', null).then((uuid) => {
    self.uuid = uuid;
    return self;
  });
}
inherits(MsRTP, RTP);

MsRTP.prototype.processSdpOffer = function (sdp) {
  return this.invoke({
    method: 'processSdp',
    sdp: sdp
  }).then((res) => {
    return res.sdpAnswer;
  });
};

MsRTP.prototype.release = function () {
  this.pipeline.releaseElement(this);
  MsRTP.super_.prototype.release.call(this);
};

MsRTP.prototype.invoke = function (params) {
  var self = this;
  return this.promise.then(() => {
    return self.pipeline.invoke(self, params);
  });
}

module.exports = MsRTP;
