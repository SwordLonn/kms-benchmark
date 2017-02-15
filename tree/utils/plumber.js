

var inherits = require('util').inherits
var Element = require('./element.js')
var kurento = require('kurento-client')

function Plumber (pipeline){
    Plumber.super_.call(this, pipeline);
    this.type = 'Plumber';
    this.linkedTo = null;
    this.endpoint = null;
    this.onStateChanged = null;
    var self = this;

}
inherits(Plumber, Element);

Plumber.prototype.processSdpOffer = function(sdpOffer){
  console.log('Plumber processSdpOffer');
}

Plumber.prototype.processSdpAnswer = function(sdpAnswer){
  console.log('Plumber processSdpAnswer');
}

Plumber.prototype.gatherCandidates = function(){
  console.log('Plumber gatherCandidates');
}

Plumber.prototype.addIceCandidate = function(candidate){
  console.log('Plumber addIceCandidate');
}

Plumber.prototype.createOffer = function(){
  console.log('Plumber createOffer');
}

Plumber.prototype.connect = function(element){
  Plumber.super_.prototype.connect.call(this, element);
}

Plumber.prototype.link = function(plumber){
  this.linkedTo = plumber;
  plumber.linkedTo = this;
}

Plumber.prototype.getMediaElement = function(){
}
Plumber.prototype.getLinkedTo = function(){
}

Plumber.prototype.release = function() {
    this.releaseLink();
    Element.prototype.release.call(this);
}

Plumber.prototype.releaseLink = function(){
    if(this.linkedTo != null){
        linkedTo.linked = null;
    }
}
module.exports=Plumber;
