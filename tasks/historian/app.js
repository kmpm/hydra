var Rpc = require('runtimerpc');

var amqp = require('amqp')
  , Logger = require('devnull');

var Models = require('hydra-models');

var rpc = new Rpc();
var amqp_config, mq, queue, exchange;

var WAITFOR=2;

rpc.getConfig('amqp', function(err, result){
  if(err) throw err;
  amqp_config = result;
  connect();
});

rpc.getConfig('mongo', function(err, result){
  models = new Models(result);
  main();
});

function connect(){
  mq = amqp.createConnection({host:amqp_config.host}); 
  mq.on("ready", function(){
    log.info("mq is ready");
    ensureExchange(function(ex){
      exchange=ex;
      ensureQueue(ex, function(q){
        queue=q;
        main();
      })
    });
  });
}


function ensureExchange(callback){
  mq.exchange(amqp_config.exchange, {type:'topic', durable:true}, callback);
}

function ensureQueue(exchange, callback){
  mq.queue('hydra-cosm', {exclusive:false, autoDelete:true}, function(q){
    q.bind(exchange.name, 'cv.#');
    callback(q);
  });
}


function queueProcessor(message, headers, deliveryInfo) {
  if(message.hasOwnProperty('device') 
      && message.hasOwnProperty('stream')
      && message.hasOwnProperty('cv')){
    
    var at = message.last_at || (new Date()).toJSON();
    var key = message.device + "." + message.stream;
    
  }
  else{
    log.warning("bad data:", message);
  }
}


function main(){
  WAITFOR-=1;
  if(WAITFOR > 0) return;
  queue.subscribe({prefetchCount: 5}, queueProcessor);
}