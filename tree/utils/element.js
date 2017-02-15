

var inherits = require('util').inherits
var Kobj = require('./kobj.js')
var Promise = require('bluebird')

function Element(pipeline){
    Element.super_.call(this);
    console.log('create element ' + pipeline);
    this.pipeline = pipeline;
    this.sinks = new Array();
    this.source = null;
}

inherits(Element, Kobj);

Element.prototype.connect = function(element){
    this.checkReleased();
    console.log('element : ' + element.label);
    console.log('this : ' + this.label);
    if(this.getPipeline().label != element.getPipeline().label){
        throw 'elements ' + this.label + ',' + element.label + ' not at same pipeline.'
    }
    this.sinks.push(element);
    element.setSource(this);
}

Element.prototype.disconnect = function(){
    this.checkReleased();
    
    if(this.source != null){
        for(var k in this.source.sinks){
            if(this === this.source.sinks[k]){
                delete this.source.sinks[k];
            }
        //delete this.source.sinks[this];
        }
    }
    this.source = null;
}

Element.prototype.setSource = function(source){
    this.checkReleased();
    this.source = source;
}

Element.prototype.handleConnected = function(){
  return new Promise(function(resolve, reject){resolve();});
}

Element.prototype.getSinks = function(){
    this.checkReleased();
    return this.sinks;
}

Element.prototype.getPipeline = function(){
    this.checkReleased();
    console.log('pipeline : ' + this.pipeline);
    return this.pipeline;
}

Element.prototype.getSource = function(){
    this.checkReleased();
    return this.source;
}

Element.prototype.release = function(){
    this.disconnect();
    for(var k in this.sinks){
        this.sinks[k].disconnect();
    }
    this.pipeline.removeElement(this);
    Kobj.prototype.release.call(this);
}

//inherits(Element, Kobj);

module.exports=Element;
