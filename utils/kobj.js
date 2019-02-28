var logger = require('rloud-logger').logger(__filename)

var inherits = require('util').inherits
var EventEmitter = require('events').EventEmitter

function Kobj(label) {
    Kobj.super_.call(this);
    this.label = label;
    this.released = false;
}
inherits(Kobj, EventEmitter);

Kobj.prototype.release = function () {
    this.released = true;
}

Kobj.prototype.checkReleased = function () {
    //not impl.
    //if(this.released)
    //    throw 'already released object : ' + this.label;
}

module.exports = Kobj;
