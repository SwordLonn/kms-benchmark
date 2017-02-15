

var inherits = require('util').inherits
//var Element = require('./element.js')
var kurento = require('kurento-client')
var Plumber = require('../utils/plumber.js')

function KPlumber (pipeline){
    KPlumber.super_.call(this, pipeline);
    this.linkedTo = null;
    this.endpoint = null;
    this.onStateChanged = null;
    var self = this;

    this.endpoint = new Promise(function (resolve, reject){
            pipeline.mediaPipeline.then(function(pipe){
                pipe.create('WebRtcEndpoint', function(error, endpoint){
                    if(error)
                        reject(error);
                    else{
                        endpoint.on('OnIceComponentStateChanged', function(event){
                            if(self.onStateChanged){
                                self.onStateChanged(self, event);
                            }
                        });
                        endpoint.on('OnIceCandidate', function(event){
                            self.emit('onIceCandidate', event.candidate);
                        });
                        resolve(endpoint);
                       
                    }
                });
            }).catch(function(error){
                reject(error);
            });
        });

}
inherits(KPlumber, Plumber);
KPlumber.prototype.connect = function(element){
    KPlumber.super_.prototype.connect.call(this, element);
    var self = this;
    console.log('plumber connect element ' + element.label);
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

KPlumber.prototype.processSdpOffer = function(sdpOffer){
  //console.log('Plumber processSdpOffer');
  var self = this;
  return new Promise(function(resolve, reject){
    self.endpoint.then(function(point){
      point.processOffer(sdpOffer, function(error, sdpAnswer){
        if(error){
          reject(error);
          return;
        }
        resolve(sdpAnswer);
      });
    }).catch(function(error){
      reject(error);
    });
  });
}

KPlumber.prototype.processSdpAnswer = function(sdpAnswer){
  //console.log('Plumber processSdpAnswer');
  var self = this;
  return new Promise(function(resolve, reject){
    self.endpoint.then(function(point){
      point.processAnswer(sdpAnswer, function(error){
        if(error){
          reject(error);
          return;
        }
        resolve();
      });
    }).catch(function(error){
      reject(error);
    });
  });
}

KPlumber.prototype.gatherCandidates = function(){
  //console.log('Plumber gatherCandidates');
  //return new Promise(function(resolve, reject){
  //})
  this.endpoint.then(function(point){
    point.gatherCandidates();
  }).catch(function(error){
    console.log(error);
  });
}

KPlumber.prototype.addIceCandidate = function(candidate){
  //console.log('Plumber addIceCandidate');
  var self = this;
  return new Promise(function(resolve, reject){
    self.endpoint.then(function(point){
      point.addIceCandidate(candidate);
      resolve();
    }).catch(function(error){
      reject(error);
    })
  });
}

KPlumber.prototype.createOffer = function(){
  //console.log('Plumber createOffer');
  var self = this;
  return new Promise(function(resolve, reject){
    self.endpoint.then(function(point){
      point.generateOffer(function(error, sdpOffer){
        if(error){
          reject(error);
          return;
        }
        resolve(sdpOffer);
      });
    }).catch(function(error){
      reject(error);
    })
  });
}

KPlumber.prototype.link = function(plumber){
    KPlumber.super_.prototype.link.call(this, plumber);    
    var self = this;    
    return new Promise(function(resolve, reject){
      self.on('onIceCandidate', function(candidate){
        candidate =  kurento.register.complexTypes.IceCandidate(candidate);
        plumber.addIceCandidate(candidate);
      });
      plumber.on('onIceCandidate', function(candidate){
        candidate =  kurento.register.complexTypes.IceCandidate(candidate);
        self.addIceCandidate(candidate);
      });
      self.createOffer().then(function(sdpOffer){
        plumber.processSdpOffer(sdpOffer).then(function(sdpAnswer){
          self.processSdpAnswer(sdpAnswer).then(function(){
            self.gatherCandidates();
            plumber.gatherCandidates();
            resolve();
          }).catch(function(error){
            reject(error);
          });
        }).catch(function(error){
          reject(error);
        });
      }).catch(function(error){
        reject(error);
      });
    });
}

KPlumber.prototype.getMediaElement = function(){
    return this.endpoint;
}

KPlumber.prototype.getLinkedTo = function(){
    return this.linkedTo;
}

KPlumber.prototype.release = function() {
    this.releaseLink();
    this.endpoint.then(function(point){
        point.release();
    });
    KPlumber.super_.prototype.release.call(this);
}

KPlumber.prototype.releaseLink = function(){
    if(this.linkedTo != null){
        linkedTo.linked = null;
    }
}

//inherits(KPlumber, Element);

module.exports=KPlumber;
