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
  mq.exchange(nconf.get("amqp:exchange"), {type:'topic', durable:true}, callback);
}

function ensureQueue(exchange, callback){
  mq.queue('hydra-raw', {exclusive:false, autoDelete:true}, function(q){
    q.bind(exchange.name, 'raw.#');
    callback(q);
  });
}


function queueProcessor(message, headers, deliveryInfo) {
  if(message.hasOwnProperty('device') && message.hasOwnProperty('datastreams')){
    var i, cv, stream;
    for(i in message.datastreams){
      stream = message.datastreams[i];
      cv = currentValue(message.device, stream);
      if(cv){
        stream.cv = cv;
        stream.status='ok';
      }
      else{
        stream.status='bad data';
      }
      models.Device.updateStreamValues(message.device, 
        stream.name,
        stream, 
        function(err){
          if(err){log.error(err);}
          var out = {device:message.device, 
            datastreams:[stream]
          };
          if(cv){
            exchange.publish('cv.'  + message.device, out);
          }
          else{
            exchange.publish('error.' + message.device, out);
          }
        });
    }
    
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
        fcache[t.name] = {};
        t.datastreams.forEach(function(d){
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

function currentValue(devicename, datastream){
  if(fcache.hasOwnProperty(devicename) && fcache[devicename].hasOwnProperty(datastream.name)){
    var sandbox = {
      numerics: numerics
    };
    var code = "var callback = " + fcache[devicename][datastream.name];
    try{
      vm.runInNewContext(code, sandbox);
    }
    catch(err){
      log.error("vm error!", err);
    }
    //log.debug(sandbox, code);
    return sandbox.callback(datastream.raw);
  }
  else{
    log.warning("no current value function for %s=>%s", devicename, datastream.name);
    return datatream.raw;
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