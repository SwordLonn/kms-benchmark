

var inherits = require('util').inherits
var Pipeline = require('./pipeline.js')
var Kobj = require('./kobj.js')
var LoadManager = require('../loadmanager.js')

var number = 0;

function IMS(label, client){
    IMS.super_.call(this);
    this.label = label;
    this.loadManager = new LoadManager(3000);
    this.pipelines = {};
    this.client = client;
    this.number = 0;
}
inherits(IMS, Kobj);

IMS.prototype.createPipeline = function(){
    //console.log('create pipeline.');
    //var pipeline =  new Pipeline(this);
    //pipeline.label = this.label + ' pipeline ' + number;
    //number ++;
    //this.pipelines[pipeline.label] = pipeline;
    //return pipeline;
    console.log('not impl.');
}

IMS.prototype.getPipelines = function(){
    return this.pipelines;
}

IMS.prototype.setLoadManager = function(manager){
    this.loadManager = manager;
}

IMS.prototype.getLoad = function(){
    return this.loadManager.caculateLoad(this);
}

IMS.prototype.allowMoreElements = function(){
    return this.loadManager.allowMoreElements(this);
}

IMS.prototype.removePipeline = function(pipeline){
    delete this.pipelines[pipeline.label];
}

//inherits(IMS, Kobj);

module.exports=IMS;
