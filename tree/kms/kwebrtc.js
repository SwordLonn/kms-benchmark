
var inherits = require('util').inherits

//var Element = require('./element.js')
var Webrtc = require('../utils/webrtc.js')


function KWebrtc(pipeline, session){
    KWebrtc.super_.call(this, pipeline, session);
    var self = this;
    
    this.endpoint = new Promise(function (resolve, reject){
            console.log('pipeline ' + pipeline);
            console.log('mediaPipeline ' + pipeline.mediaPipeline);
            pipeline.mediaPipeline.then(function(pipe){
                pipe.create('WebRtcEndpoint', function(error, endpoint){
                    if(error)
                        reject(error);
                    else{
                        endpoint.on('OnIceCandidate', function(event){
                            session(self.label, event.candidate);
                        });
                        endpoint.on('OnIceComponentStateChanged', function(event){
                            if(self.onStateChanged){
                                self.onStateChanged(self, event);
                            }
                        });
                        resolve(endpoint);
                    }
                });
            }).catch(function(error){
                reject(error);
            });
        });
}

inherits(KWebrtc, Webrtc);

KWebrtc.prototype.processSdpOffer = function(sdpOffer){
    var self = this;
    console.log('KWebrtc processSdpOffer');
    return new Promise(function (resolve, reject){
            console.log('KWebrtc endpoint : ' + self.endpoint);
            self.endpoint.then(function(point){
                    console.log('point ' + point);
                    point.processOffer(sdpOffer, function(error, sdpAnswer){
                        if(error)
                            reject(error);
                        else
                            resolve(sdpAnswer);
                    });
                }).catch(function(error){
                    reject(error);
                });
        });
}

KWebrtc.prototype.gatherCandidates = function(){
    this.endpoint.then(function(point){
            point.gatherCandidates();
        }).catch(function(error){
            console.log(error);
        });
}

KWebrtc.prototype.addIceCandidate = function(candidate){
    this.endpoint.then(function(point){
        point.addIceCandidate(candidate);
    }).catch(function(error){
        console.log(error);
    });
}

KWebrtc.prototype.getMediaElement = function(){
    return this.endpoint;
}

KWebrtc.prototype.release = function(){
    this.endpoint.then(function(point){
            point.release();
        }).catch(function(error){
            console.log(error);
        });
    KWebrtc.super_.prototype.release.call(this);
}

KWebrtc.prototype.connect = function(element){
    console.log('element : ' + element.label);
    console.log('this : ' + this.label);
    KWebrtc.super_.prototype.connect.call(this, element);
    var self = this;
    return new Promise(function(resolve, reject){
        self.endpoint.then(function(point1){
            element.endpoint.then(function(point2){
                point1.connect(point2, function(error){
                    resolve(null);
                });
            }).catch(function(error){
                reject(error);
            });
        }).catch(function(error){
            reject(error);
        });
    });
}

//inherits(KWebrtc, Element);

module.exports=KWebrtc;






