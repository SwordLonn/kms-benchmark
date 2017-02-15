

var inherits = require('util').inherits
var KPipeline = require('./kpipeline.js')
var Kobj = require('../utils/kobj.js')
var Ims = require('../utils/ims.js')
var LoadManager = require('../loadmanager.js')

var number = 0;

function Kms(label, client){
    Kms.super_.call(this);
    this.label = label;
    this.loadManager = new LoadManager(3000);
    this.pipelines = {};
    this.client = client;
}
inherits(Kms, Ims);

Kms.prototype.createPipeline = function(){
    console.log('create pipeline.');
    var pipeline =  new KPipeline(this);
    pipeline.label = this.label + ' pipeline ' + number;
    number ++;
    this.pipelines[pipeline.label] = pipeline;
    return pipeline;
}

Kms.prototype.getPipelines = function(){
    return this.pipelines;
}

Kms.prototype.setLoadManager = function(manager){
    this.loadManager = manager;
}

Kms.prototype.getLoad = function(){
    return this.loadManager.caculateLoad(this);
}

Kms.prototype.allowMoreElements = function(){
    return this.loadManager.allowMoreElements(this);
}

Kms.prototype.removePipeline = function(pipeline){
    delete this.pipelines[pipeline.label];
}

//inherits(Kms, Kobj);

module.exports=Kms;
