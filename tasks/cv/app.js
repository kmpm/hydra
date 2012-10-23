var amqp = require('amqp')
  , Logger = require('devnull')
  , vm = require('vm');

var models = require('hydra-models');

var WAITFOR=1;

var DEFAULTS = {
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


var numerics = require('./lib/numerics');



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

//var rpc = new (require('./lib/amqprpc'))(mq);
var rpc = new (require('./lib/runtimerpc'))();

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
  mq.exchange(nconf.get("amqp:exchange"), {type:'topic', durable:true}, callback);
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
  if(message.hasOwnProperty('device') && message.hasOwnProperty('stream')
      && message.hasOwnProperty('raw')){
    var i, cv;
    var values = {raw: message.raw};
    cv = currentValue(message);
    if(cv){
      message.cv = cv;
      message.status='ok';
      values.cv=cv;
    }
    else{
      message.status='bad data';
    }
    values.status=message.status;

    models.Device.updateStreamValues(message.device, 
      message.stream,
      values, saveDone);
      

    function saveDone(err){
      if(err){log.error(err);}
      log.debug("updated cv value '%s.%s' to '%s'", message.device, message.stream, message.cv);
      var routing = message.device + '.' + message.stream;
      if(cv){
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

function loadCache(){
  //rpc.makeRequest(exchange, 'rpc.server', {method:'getFuncCv', options:{}}, function(err, result){
  rpc.makeRequest({method:'getFuncCv', options:{}}, function(err, result){
    if(err) return log.error("could not get cache %s", err);
    console.log("err:%s, result:%j", err, result);
    if(result.status == 200){
      fcache = {};
      result.body.forEach(function(t){
        fcache[t.name] = {};
        t.streams.forEach(function(d){
          if(d.func_cv.length >5 )
            fcache[t.name][d.name]=d.func_cv;
        });
      });
      console.log("fcache=", fcache);
    }
    else {
      log.error("error getting cache", result);
    }
  });
}

/*
   @message Object {device: ,stream:, raw}
*/
function currentValue(message){
  var device = message.device;
  var stream = message.stream;
  var raw = message.raw;
  if(fcache.hasOwnProperty(device) && fcache[device].hasOwnProperty(stream)){
    var sandbox = {
      numerics: numerics
    };
    var code = "var callback = " + fcache[device][stream];
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
    log.warning("no current value function for %s=>%s", device, stream);
    return raw;
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