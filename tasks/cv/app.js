var amqp = require('amqp')
  , Logger = require('devnull')
  , vm = require('vm');


var rpc = new (require('runtimerpc'))();
var Models = require('hydra-models');

var numerics = require('./lib/numerics');

var WAITFOR=2;
var amqp_config, models;

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
  main();
});


var log = new Logger();
var mq
var queue;
var exchange;
var fcache={};

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
  mq.queue('hydra-raw', {exclusive:false, autoDelete:true}, function(q){
    q.bind(exchange.name, 'raw.#');
    callback(q);
  });
}


/*
   @message Object {device: ,stream:, raw}
*/
function queueProcessor(message, headers, deliveryInfo) {
  if(message.hasOwnProperty('stream')
      && message.hasOwnProperty('raw')){
    var i, cv;
    var values = {raw: message.raw};
    cv = currentValue(message);
    if(typeof(cv) !== 'undefined' && cv !== null){
      message.cv = cv;
      message.status='ok';
      values.cv=cv;
      values.last_cv = new Date();
      message.last_cv = values.last_cv;
    }
    else{
      message.status='bad data';
    }
    values.status=message.status;

    models.Stream.updateStreamValues(message.stream, 
      values, saveDone);
      

    function saveDone(err, stream){
      if(err){log.error(err);}
      log.debug("updated cv value '%s' to '%s'", stream._id, message.cv);
      var routing = message.stream;
      if(typeof(cv) !== 'undefined' && cv !== null){
        exchange.publish('cv.'  + routing, message);
      }
      else{
        exchange.publish('error.' + routing, message);
      }
    }
    
    
  }
  else{
    log.warning("bad raw:", message);
  }
}

function loadCache(callback){
  callback = callback || function(){};
  //rpc.makeRequest(exchange, 'rpc.server', {method:'getFuncCv', options:{}}, function(err, result){
  rpc.getFuncCv({}, function(err, result){
    if(err) { 
      log.error("could not get cache %s", err); 
      return callback();
    }
    fcache = {};
    result.forEach(function(stream){
      if(stream.func_cv.length >5 )
        fcache[stream._id]=stream.func_cv;
    });
    callback();
    //log.debug("fcache=%j", fcache);
  });
}

/*
   @message Object {device: ,stream:, raw}
*/
function currentValue(message){
  var stream = message.stream;
  var raw = message.raw;
  if(fcache.hasOwnProperty(stream)){
    var sandbox = {
      numerics: numerics
    };
    var code = "var callback = " + fcache[stream];
    try{
      vm.runInNewContext(code, sandbox);
    }
    catch(err){
      log.error("vm error!", err);
    }
    //log.debug(sandbox, code);
    return sandbox.callback(raw);
  }
  else{
    log.warning("no current value function for %s", stream);
    return raw;
  }
}



function main(){
  WAITFOR-=1;
  if(WAITFOR > 0) return;
  loadCache(function(){
    queue.subscribe({prefetchCount: 5}, queueProcessor);  
  });
  
  
  setInterval(loadCache, 60000);
}