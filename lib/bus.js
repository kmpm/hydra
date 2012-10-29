var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var amqp = require('amqp');

var Rpc = require('./rpc')
  c = require('./common');

function Bus(){
  var self = this;
  Bus.super_.call(this);

  var WAITFOR=2;
  var rpc = new Rpc();
  this.rpc = rpc;
  var ac = c.config.get("amqp");
  var conn = amqp.createConnection({host:ac.host});
  this.conn = conn;
  conn.on("ready", function(){
    conn.exchange(ac.exchange, {type:'topic', durable:true}, function(e){
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
  return function(req, headers, deliveryInfo, m){
    self.emit("request", req);
    self.rpc.execute(req, function(res){
      var to = deliveryInfo.replyTo;
      var id = deliveryInfo.correlationId;
      if(res.id !== null){
        self.conn.publish(to, res, {correlationId:id});
      }
      //c.log.debug("reply sent to:%s", to);
      self.emit("executed", req, res);
    });
  };
};

module.exports = Bus;