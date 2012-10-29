var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , Logger = require('devnull')
  ,  amqp = require('amqp');


var AmqpRpc = require('amqprpc')
  RuntimeRpc = require('runtimerpc');

var runtimerpc = new RuntimeRpc();



exports = module.exports = Runtime;

function Runtime(){
  var self = this;
  self.log = new Logger();
  self.amqp_config = {};

  runtimerpc.getConfig('amqp', function(err, result){
    if(err){
      self.log.error("error getting config");
      throw err;
    }
    self.amqp_config = result;
    self.connect();
  });
}

util.inherits(Runtime, EventEmitter);

Runtime.prototype.connect = function(){
  var self = this;
  mq = amqp.createConnection({host:this.amqp_config.host});
  mq.on("ready", function(){
    self.log.info("mq is ready");
    self.ensureExchange(function(ex){
      self.exchange=ex;
      self.rpc = new AmqpRpc(mq, ex);
      self.emit("ready");
    });
  });
}


Runtime.prototype.ensureExchange = function(callback){
  mq.exchange(this.amqp_config.exchange, {type:'topic', durable:true}, callback);
}

Runtime.prototype.ensureQueue = function (queuename, routingKey, callback){
  var self = this;
  mq.queue(queuename, {exclusive:false, autoDelete:true}, function(q){
    q.bind(self.exchange.name, routingKey);
    callback(q);
  });
}

Runtime.prototype.publish = function(routingKey, payload, callback){
  this.exchange.publish(routingKey, payload, callback);
}

Runtime.prototype.getConfig = function (key, callback){
  runtimerpc.getConfig(key, callback);
}