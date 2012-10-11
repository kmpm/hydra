var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var amqp = require('amqp');

var Api = require('./Api')
  c = require('./common');

function Bus(){
  var self = this;
  Bus.super_.call(this);

  var WAITFOR=2;
  var api = new Api();
  this.api = api;
  api.on("ready", done);
  var ac = c.config.amqp;
  var conn = amqp.createConnection({host:ac.host});
  this.conn = conn;
  conn.on("ready", function(){
    conn.exchange(ac.exchange, {type:'topic'}, function(e){
      conn.queue('hydra-server-api', function(q){
        q.bind(e, 'rpc.server.#');
        self.queue = q;
        self.exchange = e;
        done();
        q.subscribe(self._subscriber(q));
      });  
    });
  });

  function done(){
    WAITFOR--;
    if(WAITFOR>0) return;
    c.log.info("bus is ready");
    self.emit("ready");
  }

}

util.inherits(Bus, EventEmitter);


Bus.prototype.end = function(){
  this.conn.end();
}

Bus.prototype._subscriber = function(queue) {
  var self = this;
  return function(message, headers, deliveryInfo, m){
    self.emit("message", message);
    self.execute(message, function(err, result){
      var reply = result;
      if(err){
        c.log.warning(err);
        reply.status=500;
        reply.body=err;
      }
      c.log.debug("back from execution: %j", result);
      var to = deliveryInfo.replyTo;
      var id = deliveryInfo.correlationId;
      
      self.conn.publish(to, result, {correlationId:id});
      c.log.debug("reply sent to:%s", to);
      self.emit("executed", message, reply);
    });
  }
}

Bus.prototype.execute = function(message, callback){
  c.log.debug("executing %j", message);
  try{
    var result={status:500, body: 'not implemented error'};
    c.log.debug(typeof(this.api[message.method]));
    if(typeof(this.api[message.method]) !== 'function'){
      c.log.warning("missing method " + message.method);
      return callback(null, {status:404, body:'method not found. ' + message.method});
    }
    //otherwise
    this.api[message.method](message.options, function(err, body){
      callback(null, {status:200, body:body});
    });
  }
  catch(err){
    c.log.error("excution error", err);
    callback(err, result);
  }
}


module.exports = Bus;