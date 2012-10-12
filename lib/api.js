var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var c = require('./common')
  , storage = require('./storage');


function Api(){
  Api.super_.call(this);
  var self = this;

  storage.ready(function(){
    c.log.info("api is ready");
    self.emit("ready");  
  });
}

util.inherits(Api, EventEmitter);


Api.prototype.foo = function(options, callback){
  callback(null, {bar:'spam', options:options});
}

Api.prototype.getFuncCv = function(options, callback){
  storage.getFuncCv(options, function(err, cursor){
    if(err) return callback(err);
    cursor.toArray(callback);
  });
}

module.exports = Api;