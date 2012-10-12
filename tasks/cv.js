var amqp = require('amqp')
  , Logger = require('devnull')
  , vm = require('vm');




var numerics = require('./lib/numerics');

var MQ_HOST = 'hydra.mustad.se';

var STORAGE_PORT=6379;
var STORAGE_HOST='bruxsvr01.mustad.se';

var WAITFOR=2;

var log = new Logger();

// use the stream transport to log to a node.js stream
log.use(require('devnull/transports/stream'), {
    stream: require('fs').createWriteStream('hydra-cv.log')
});



var mq = amqp.createConnection({host:MQ_HOST});
var queue;
var exchange;
var fcache;

var rpc = new (require('./lib/amqprpc'))(mq);

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





function ensureExchange(callback){
  mq.exchange('hydra.topic', {type:'topic', durable:true}, callback);
}

function ensureQueue(exchange, callback){
  mq.queue('hydra-raw', {exclusive:false, autoDelete:true}, function(q){
    q.bind(exchange.name, 'raw.#');
    callback(q);
  });
}


function queueProcessor(message, headers, deliveryInfo) {
  if(message.hasOwnProperty('key') && message.hasOwnProperty('raw')){
    
    var cv = currentValue(message);
    log.debug("key:%s raw:%s cv:%s", message.key, message.raw, cv);
    var at = (new Date()).toJSON();
    var data=['hydra:' + message.key, 'at', at];
    data.push('raw');
    data.push(message.raw);
    var status='ok';
    if(cv){
      data.push('cv');
      data.push(cv);
    }
    else{
      status='bad data';
    }
    data.push('status');
    data.push(status);
    message.status = status;
    storage.hmset(data, function(err, res){
      if(err){
        log.error(err);
      }
      if (cv) {
        message.cv = cv;
        exchange.publish('cv.'  + message.key, message);
      }else{
        exchange.publish('error.' + message.key, message);
      }
    });  
  }
  else{
    log.warning("bad raw:", message);
  }
}

function loadCache(){
  rpc.makeRequest(exchange, 'rpc.server', {method:'getFuncCv', options:{}}, function(err, result){
    console.log(result);
  });
}

function currentValue(message){
  if(fcache.hasOwnProperty(message.key)){
    var sandbox = {
      numerics: numerics
    };
    var code = "var callback = " + fcache[message.key];
    try{
      vm.runInNewContext(code, sandbox);
    }
    catch(err){
      log.error("vm error!", err);
    }
    log.debug(sandbox, code);
    return sandbox.callback(message.raw);
  }
  else{
    log.warning("no current value function for %s", message.key)
    return message.raw;
  }
  
}

function main(){
  WAITFOR-=1;
  if(WAITFOR > 0) return;
  log.info("liftoff");
  queue.subscribe({prefetchCount: 5}, queueProcessor);
  loadCache();
  setInterval(loadCache, 60000);

}