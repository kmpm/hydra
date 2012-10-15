var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var c = require('./common')
  , models = require('hydra-models');


function Api(){
  Api.super_.call(this);
  var self = this;

  
  c.log.info("api is ready");
  process.nextTick(function(){
    self.emit("ready");  
  });
  
  
}

util.inherits(Api, EventEmitter);


Api.prototype.foo = function(options, callback){
  callback(null, {bar:'spam', options:options});
}

Api.prototype.getFuncCv = function(options, callback){
  models.Device.find_funcCv(function(err, devices){
    if(err) return callback(err);
    callback(null, devices);
  });
}


module.exports = Api;