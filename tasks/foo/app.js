

var amqp = require('amqp')
  , Logger = require('devnull');
var rpc = new (require('runtimerpc'))();
var Models = require('hydra-models');




var WAITFOR=2;
var amqp_config, mq, exchange, models, streams;


var log = new Logger();

rpc.getConfig('amqp', function(err, result){
  if(err){
    log.error("error getting config");
    throw err;
  }
  amqp_config = result;
  connect();
});

rpc.getConfig('mongo', function(err, result){
  models = new Models(result);

  models.Stream.find({name:'foo'}, function(err, list){
    if(err) {
      log.error("no streams found");
      throw err;
    }
    streams = list;
    log.debug("%s streams to process", streams.length);
    main();
  }); 
});


function connect(){
  mq = amqp.createConnection(amqp_config);
  mq.on("ready", function(){
    log.info("mq is ready");
    ensureExchange(function(ex){
      exchange=ex;
      main();
    });
  });
}


function ensureExchange(callback){
  mq.exchange(amqp_config.exchange, {type:'topic', durable:true}, callback);
}


function genRandNum() {
  return (Math.floor(Math.random() * 90000) + 10000).toString();
}


function main(){
  WAITFOR=-1;
  if(WAITFOR > 0 ) return;

  setInterval(function(){
    streams.forEach(function(stream){
      exchange.publish('raw.' + stream._id, {
        stream: stream._id, 
        at: Date.now(), 
        raw: genRandNum()});
    });
    
  }, 15000);
}