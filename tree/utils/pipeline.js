
var inherits = require('util').inherits
//var Promise = require('bluebird')
var Kobj = require('./kobj.js')
//var Webrtc = require('./webrtc.js')
//var Plumber = require('./plumber.js')
//var Recorder = require('./recorder.js')

function Pipeline(kms){
    Pipeline.super_.call(this);
    
    this.kms = kms;
    this.webrtcs = new Array();
    this.plumbers = new Array();
    this.recorders = new Array();
    this.numbers = 0;
    this.onStateChanged = null;
}
inherits(Pipeline, Kobj);

Pipeline.prototype.getKms = function(){
    return this.kms;
}

Pipeline.prototype.createWebRtc = function(session){
    this.checkReleased();
    return null;
}

Pipeline.prototype.createRecorder = function(uri){
    return null;
}

Pipeline.prototype.createPlumber = function(){
    return null;
}

Pipeline.prototype.getWebrtcs = function(){
    this.checkReleased();
    return this.webrtcs;
}

Pipeline.prototype.getPlumbers = function(){
    this.checkReleased();
    return this.plumbers;
}

Pipeline.prototype.getElements = function(){
    
    console.log('get elements : ' + this.label);
    for(var item in this.plumbers)
        console.log('plumbers : ' + item + ' label ' + this.plumbers[item].label);
    for(var item in this.webrtcs)
        console.log('webrtcs : ' + item + ' label ' + this.webrtcs[item].label);
    var res = [];
    for(var item in this.plumbers)
        res.push(this.plumbers[item]);
    for(var item in this.webrtcs)
        res.push(this.webrtcs[item]);
    return res;
}

Pipeline.prototype.link = function(pipeline){
    this.checkReleased();
    var psrc = this.createPlumber();
    var psink = pipeline.createPlumber();
    psrc.label = 'plumber source ' + psrc.label;
    psink.label = 'plumber sink ' + psink.label;
    console.log('pipeline link : ' + this.label + ' ' + pipeline.label );

    return new Promise(function(resolve, reject){
            psrc.link(psink).then(function(){
                resolve([psrc, psink]);
            }).catch(function(error){
                reject(error);
            });
        });
}

Pipeline.prototype.removeElement = function(element){
    this.checkReleased();
    for(var i in this.webrtcs){
        if(element === this.webrtcs[i]){
            delete this.webrtcs[i];
            break;
        }
    }
    for(var i in this.plumbers){
        if(element === this.plumbers[i]){
            delete this.plumbers[i];
            break;
        }
    }
}

Pipeline.prototype.release = function(){
    var elements = this.getElements();
    for (var elem in elements){
      this.removeElement(elem);
      elem.release();
    }
    this.getKms().removePipeline(this);
    this.mediaPipeline.then(function(pipe){
            pipe.release();
        });
    Pipeline.super_.release.call(this);
}

module.exports = Pipeline;
