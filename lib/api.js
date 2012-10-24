var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var c = require('./common');
var PERSISTENT_DELIVERY = 2;

var models = c.models;

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

/* @options {device: , stream:, raw:, exchange: } */
Api.prototype.publishRaw = function(options, callback) {
  try{
    var routing = 'raw.' + options.device + '.' + options.stream;
    var payload = {device:options.device, stream:options.stream, raw:options.raw, at:(new Date()).toJSON()};
    options.exchange.publish(routing, payload, {deliveryMode: PERSISTENT_DELIVERY}, function(sentWithError){
      callback(null, {sent: sentWithError === false});
    });
  }
  catch(err){
    callback(err);
  }
}

Api.prototype.getConfig = function(options, callback) {
  try {
    var payload = c.config.get(options);
    callback(null, payload);
  }
  catch(err){
    c.log.warn("error geting config...", err);
    callback(err);
  }
}
module.exports = Api;