
var inherits = require('util').inherits

var Element = require('./element.js')

function Recorder(pipeline, uri){
    Recorder.super_.call(this, pipeline);
    var self = this;
    this.type = 'Recorder';
    this.uri = uri;
    this.label = 'recorder ' + uri;
    console.log('create Recorder ' + this.label);
    //this.session = session;
    //this.onStateChanged = null;
    
    //this.endpoint = new Promise(function (resolve, reject){
    //        pipeline.mediaPipeline.then(function(pipe){
    //            pipe.create('RecorderEndpoint', {uri : self.uri}, function(error, endpoint){
    //                if(error)
    //                    reject(error);
    //                else{
    //                    console.log('create recorder endpoint success.');
    //                    resolve(endpoint);
    //                }
    //            });
    //        }).catch(function(error){
    //            reject(error);
    //        });
    //    });
}

inherits(Recorder, Element);

Recorder.prototype.record = function(){
    //this.endpoint.then(function(point){
    //        console.log('start record.');
    //        point.record();
    //    });
}

Recorder.prototype.getMediaElement = function(){
    //return this.endpoint;
}

Recorder.prototype.release = function(){
    //this.endpoint.then(function(point){
    //        point.release();
    //    }).catch(function(error){
    //        console.log(error);
    //    });
    //Element.prototype.release.call(this);
}

Recorder.prototype.connect = function(element){
    //console.log('element : ' + element.label);
    //console.log('this : ' + this.label);
    //Recorder.prototype.connect.call(this, element);
    //var self = this;
    //return new Promise(function(resolve, reject){
    //    self.endpoint.then(function(point1){
    //        element.endpoint.then(function(point2){
    //            point1.connect(point2, function(error){
    //                //self.record();
    //                resolve(null);
    //            });
    //        }).catch(function(error){
    //            reject(error);
    //        });
    //    }).catch(function(error){
    //        reject(error);
    //    });
    //});
}

//inherits(Recorder, Element);

module.exports=Recorder;






