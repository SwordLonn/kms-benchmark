//
var url = require('url')
var http = require('http')
var Plumber = require('./utils/plumber.js')

function BMTree(treeId, kmsManager, streams_per_viewer){
    this.kmsManager = kmsManager;
    this.treeId = treeId;
    this.sourceKms = null;
    this.sourcePipeline = null;
    this.sourcePlumbers = {};
    this.source = null;
    this.leafPipelines = {}
    this.leafPlumbers = {};
    this.sinks = {};
    this.ownPipelineByKms = {};
    this.webrtcs = {};
    this.numSinks = 0;
    this.realPipelineByKms = {};
    this.sourceKms = null;
    this.benchmarks = {};
    this.sinkid = 0;
    this.streams_per_viewer = streams_per_viewer;
    console.log('create BMTree ' + treeId + ' streams_per_viewer ' + streams_per_viewer);
}

BMTree.prototype.release = function(){
    this.source.release();
    for(var id in this.webrtcs){
        this.webrtcs[id].release();
    }
}

BMTree.prototype.removeTreeSource = function(){
    if(this.source != null){
        this.source.release();
        this.source = null;
        this.sourceKms = null;
        this.sourcePipeline = null;
        this.sourcePlumbers = {};
        this.leafPipelines = {};
        this.leafPlumbers = {};
        this.sinks = {};
        this.ownPipelineByKms = {};
        this.webrtcs = {};
        this.numSinks = 0;
        this.realPipelineByKms = {};
        this.benchmarks = {};
    }
}

BMTree.prototype.onStateChange = function(pipeline, endpoint, event){

}

BMTree.prototype.setTreeSource = function(session, offer, domain){
    if(this.source != null){
        this.removeTreeSource();
    }
    var self = this;
    return new Promise(function(resolve, reject){
      var promise = self.kmsManager.first;
      promise.then( function(kms){
           self.sourceKms = promise;
           if(self.sourcePipeline == null){
             self.sourcePipeline = new Promise(function(resolve, reject){
               var pipe = kms.createPipeline();
               pipe.label = self.treeId;
               console.log("kms label " + kms.label);
               resolve(pipe);
            });
            self.ownPipelineByKms[kms.label] = self.sourcePipeline;
            self.sourcePipeline.onStateChange = self.onStateChange.bind(self);
          }
          self.sourcePipeline.then(function(pipe){
            self.source = pipe.createWebRtc(session);
            self.source.label = "Tree src " + self.treeId;
            self.source.processSdpOffer(offer).then(function(answer){
            self.source.gatherCandidates();
            resolve({'answer':answer, 'id':self.source.label});
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

BMTree.prototype.addTreeSink = function(session, offer, domain){
    var self = this;
    return new Promise(function(resolve, reject){
            var kms = self.kmsManager.second;
            kms.then(function(kmsr){
                var pipeline = self.getOrCreatePipeline(kmsr);
                pipeline.then(
                    function(pipe){
                        var id = this.sinkid ++ ;
                        var webrtc = pipe.createWebRtc(session);
                        webrtc.label = "Tree sink " + self.treeId + " "+ id;
                        if(pipeline == self.sourcePipeline){
                            self.source.connect(webrtc).then(function(){
                                    console.log('webrtc connected');
                                    webrtc.processSdpOffer(offer).then(function(answer){
                                        webrtc.gatherCandidates();
                                        self.webrtcs[webrtc.label] = webrtc;
                                        resolve({'answer':answer, 'id':webrtc.label});
                                    }).catch(function(error){
                                        reject(error);
                                    });
                                }
                            ).catch(function(error){
                                reject(error);
                            });
                            return;
                        }
                        console.log('pipeline plumbers ' + pipe.getPlumbers());
                        for(var plumber in pipe.getPlumbers()){
                            plumber = pipe.getPlumbers()[plumber];
                            console.log('plumber ' + plumber + ' value ' + pipe.getPlumbers()[plumber]);
                            console.log(plumber.constructor.name);
                            if(!(plumber instanceof Plumber)){
                                continue;
                            }
                            console.log('connect plumber.');
                            plumber.connect(webrtc).then(
                                function(){
                                    webrtc.processSdpOffer(offer).then(function(answer){
                                        webrtc.gatherCandidates();
                                        self.webrtcs[webrtc.label] = webrtc;
                                        resolve({'answer':answer, 'id':webrtc.label});
                                    }).catch(function(error){
                                        reject(error);
                                    });
                            }).catch(function(error){
                                reject(error);
                            });
                            break;
                        }
                        console.log('after loop.');
                    }).catch(function(error){
                        reject(error);
                    });
                }).catch(function(error){
                    reject(error);
                });
            });
}

var records = 0;

BMTree.prototype.getOrCreatePipeline = function(kms){
    console.log('kms label.' + kms.label);
    console.log(this.ownPipelineByKms);
    var pipeline = this.ownPipelineByKms[kms.label];
    if(pipeline == null){
        console.log("pipeline is null");
        var self = this;
        console.log('create pipeline promise.');
        pipeline = new Promise( function(resolve, reject){
                    var pipe = kms.createPipeline();
                    pipe.label = self.treeId;
                    pipe.onStateChange = self.onStateChange.bind(self);
                    self.ownPipelineByKms[kms.label] = pipeline;
                    console.log('after pipeline created.');
                    self.sourcePipeline.then(function(sp){
                        sp.link(pipe).then( function(plumbers){
                            self.source.connect(plumbers[0]).then(function(){
                              self.sourcePlumbers[plumbers[0]]=1;
                              self.leafPlumbers[plumbers[1]]=1;
                              console.log('after pipeline linked.');
                              resolve(pipe);
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
    pipeline.then(function(pipe){
      self.sourcePipeline.then(function(sp){
        var idx = 0;
        for(var i = 0 ; i < self.streams_per_viewer ; ++ i){
          setTimeout(function(){
            sp.link(pipe).then(function(plumbers){
              self.source.connect(plumbers[0]);
              idx ++ ;
              console.log('idx ' + idx);  
              //if(idx % 30 == 1){
              //  var recorder = pipe.createRecorder('file:////tmp/record-' + idx + '.webm');
              //  plumbers[1].connect(recorder).then(function(){
              //    recorder.record();
              //  }).catch(function(error){
              //    console.log('connect failed for ' + error);
              //  });
              //}
           }).catch(function(error){
             console.log('link failed for ' + error);
           });
         },i * 1000);
       }
     });
   });
   return pipeline;
}
BMTree.prototype.removeTreeSink = function(sinkId){
    var webrtc = this.webrtcs[sinkId];
    if(webrtc){
        var plumber = webrtc.getSource();
        webrtc.release();
        if(plumber.getSinks().length <= 0){
            var remote = plumber.getLinkedTo();
            var pipeline = plumber.getPipeline();
            delete ownPipelineByKms[pipeline.getKms().label];
            pipeline.release();
            remote.release();
        }
    }
}

BMTree.prototype.addIceCandidate = function(label, candidate)
{
    if(this.source && label == this.source.label){
        this.source.addIceCandidate(candidate);
    }else{
        var webrtc = this.webrtcs[label];
        if(webrtc){
            webrtc.addIceCandidate(candidate);
        }
    }
}

module.exports = BMTree;
