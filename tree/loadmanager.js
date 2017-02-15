

//max webrtc load manager
//var Ims = require('./utils/ims.js')
var Pipeline = require('./utils/pipeline.js')

function LoadManager(max){
    this.max = max;
}

LoadManager.prototype.caculateLoad = function(kms){
    var num = this.countLoads(kms);
    return num;
    console.log(num);
    if(num > this.max)
        return 1.0;
    return num * 1.0 / this.max;
}

LoadManager.prototype.countLoads = function(kms){
    var num = 0;
    for(var key in kms.pipelines){
        num += kms.pipelines[key].getElements().length;
    }
    return num;
}

LoadManager.prototype.allowMoreElements = function(kms){
    return this.countLoads(kms) < this.max;
}

module.exports=LoadManager;
