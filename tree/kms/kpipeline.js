
var inherits = require('util').inherits
var Pipeline = require('../utils/pipeline.js')
var Kobj = require('../utils/kobj.js')
var KWebrtc = require('./kwebrtc.js')
var KPlumber = require('./kplumber.js')
var KRecorder = require('./krecorder.js')


function KPipeline(kms){
    KPipeline.super_.call(this, kms); 
    this.mediaPipeline = new Promise(function (resolve, reject){
            kms.client.create('MediaPipeline', function(error, pipeline){
                if(error)
                    reject(error);
                else
                    resolve(pipeline);
            });
        });
    console.log('pipeline ' + this.mediaPipeline);
}
inherits(KPipeline, Pipeline);

KPipeline.prototype.getKms = function(){
    return this.kms;
}

KPipeline.prototype.createWebRtc = function(session){
    this.checkReleased();
    var webrtc = new KWebrtc(this,session);
    var self = this;
    webrtc.onStateChanged = function(endpoint, event){
        if(self.onStateChanged){
            self.onStateChanged(self, endpoint, event);
        }
    }
    this.webrtcs.push(webrtc);
    return webrtc;
}

KPipeline.prototype.createRecorder = function(uri){
    this.checkReleased();
    var recorder = new KRecorder(this, uri);
    var self = this;
    this.recorders.push(recorder);
    return recorder;
}

KPipeline.prototype.createPlumber = function(){
    this.checkReleased();
    var plumber = new KPlumber(this);
    plumber.label = this.label + " " + this.numbers;
    this.numbers ++ ;
    var self = this;
    plumber.onStateChanged = function(endpoint, event){
        if(self.onStateChanged){
            self.onStateChanged(self, endpoint, event);
        }
    };
    this.plumbers.push(plumber);
    return plumber;
}

KPipeline.prototype.getWebrtcs = function(){
    this.checkReleased();
    return this.webrtcs;
}

KPipeline.prototype.getPlumbers = function(){
    this.checkReleased();
    return this.plumbers;
}

KPipeline.prototype.getElements = function(){
    
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
/*
KPipeline.prototype.link = function(pipeline){
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
*/
KPipeline.prototype.removeElement = function(element){
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
    //delete this.webrtcs[element];
    //delete this.plumbers[element];
}

KPipeline.prototype.release = function(){
    var elements = this.getElements();
    for (var elem in elements){
      this.removeElement(elem);
      elem.release();
    }
    this.getKms().removePipeline(this);
    this.mediaPipeline.then(function(pipe){
            pipe.release();
        });
    KPipeline.super_.release.call(this);
}

module.exports = KPipeline;
