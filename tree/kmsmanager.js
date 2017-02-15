
var kurento = require('kurento-client')
var Kms = require('./kms/kms.js')
//
var http = require('http')
var url = require('url')
var Promise = require('bluebird')

function KmsManager(first, second){
  this.first = new Promise(function(resolve, reject){
    kurento(first, function(error, client){
      if(error)
        reject(error);
      else{
        resolve(new Kms(first, client));
      }
    });    
  });
  this.second = new Promise(function(resolve, reject){
    kurento(second, function(error, client){
      if(error)
        reject(error);
      else{
        resolve(new Kms(second, client));
      }
    });
  });
}

module.exports = KmsManager;
