
var inherits = require('util').inherits

var Element = require('./element.js')

function Webrtc(pipeline, session){
    Webrtc.super_.call(this, pipeline);
    var self = this;
    this.type = 'WebRTC';
    this.session = session;
    this.onStateChanged = null;
}

inherits(Webrtc, Element);

Webrtc.prototype.processSdpOffer = function(sdpOffer){
  console.log('Webrtc processSdpOffer');
}

Webrtc.prototype.processSdpAnswer = function(sdpAnswer){
  console.log('Webrtc processSdpAnswer');
}

Webrtc.prototype.gatherCandidates = function(){
  console.log('Webrtc gatherCandidates');
}

Webrtc.prototype.addIceCandidate = function(candidate){
  console.log('Webrtc addIceCandidate');
}

Webrtc.prototype.getMediaElement = function(){
  console.log('Webrtc getMediaElemet');
}

Webrtc.prototype.gatherCandidates = function(){
  console.log('gatherCandidates');
}

Webrtc.prototype.createOffer = function(){
  console.log('Webrtc createOffer');
}

Webrtc.prototype.release = function(){
  console.log('Webrtc release');
}

Webrtc.prototype.connect = function(element){
  //console.log('Webrtc connect');
  Webrtc.super_.prototype.connect.call(this, element);
}

module.exports=Webrtc;






