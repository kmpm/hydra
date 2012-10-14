var amqp = require('amqp')
  , Logger = require('devnull')
  , vm = require('vm');

var WAITFOR=2;

var DEFAULTS = {
  mongo:{
    host:'localhost',
    port: 27017,
    dbname: 'hydra'}, 
  amqp:{
    host:'localhost',
    vhost:'/',
    exchange:'hydra.topic'
  }
}

var nconf = require('nconf');

nconf.argv()
  .file('config.json')
  .defaults(DEFAULTS);


var numerics = require('./lib/numerics')
  , Storage = require('./lib/storage');



var MQ_HOST = nconf.get("amqp:host");

var log = new Logger();

// use the stream transport to log to a node.js stream
log.use(require('devnull/transports/stream'), {
    stream: require('fs').createWriteStream('hydra-cv.log')
});



var mq = amqp.createConnection({host:MQ_HOST});
var queue;
var exchange;
var fcache={};

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


var storage = new Storage(nconf.get('mongo'));
storage.on("ready", function(){
  log.info("storage is ready");
  main();
});


function ensureExchange(callback){
  mq.exchange(nconf.get("amqp:exchange"), {type:'topic', durable:true}, callback);
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
    var doc = {raw:message.raw, status:'ok'};

    if(cv){
      doc.cv = cv;
    }
    else{
      doc.status='bad data';
    }
    
    storage.set(message.key, doc, function(err, res){
      if(err){ log.error(err); }
      if(cv) {
        message.cv = cv;
        message.status=doc.status;
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
    if(result.status == 200){
      fcache = {};
      result.body.forEach(function(t){
        fcache[t.name] = t.func_cv;
      });
      console.log("fcache=", fcache);
    }
    else {
      c.log.error("error getting cache", result);
    }
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
    //log.debug(sandbox, code);
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