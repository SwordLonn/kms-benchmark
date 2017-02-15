
var url = require('url')
var http = require('http')

var treeid = 0;
var sinkid = 0;

var BMTree = require('./bmtree.js')

function TreeManager(kmsManager, center, local_url){
    this.kmsManager = kmsManager;
    this.center = center;
    this.local_url = local_url;
}

TreeManager.prototype.getKmsManager = function(){
    return this.kmsManager;
}

TreeManager.prototype.createTree = function(treeId, tree_type, streams_per_viewer) {
    if(tree_type == 'benchmark'){
        console.log('create BMTree');
        return new BMTree(treeId, this.kmsManager, streams_per_viewer);
    }
}

module.exports=TreeManager;
