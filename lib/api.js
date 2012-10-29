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
  models.Stream.find_funcCv(function(err, streams){
    if(err) return callback(err);
    callback(null, streams);
  });
}

/* @options {device: , stream:, raw:, exchange: } */
Api.prototype.publishRaw = function(options, callback) {
  try{
    var routing = 'raw.' + options.stream;
    var payload = {stream:options.stream, raw:options.raw, at:(new Date()).toJSON()};
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


Api.prototype.streamFind = function(options, callback){
  models.Stream.find(options, callback);
}

Api.prototype.streamUpdate = function(options, callback){
  if(options.hasOwnProperty('conditions') 
    && options.hasOwnProperty('update')){
    models.Stream.update(options.conditions, options.update, callback);
  }
  else{
    callback(new Error("missing parameters"));
  }
}

module.exports = Api;