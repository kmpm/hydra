var amqp = require('amqp')
  , vm = require('vm');

var Runtime = require('runtime')
  , Models = require('hydra-models')
  , numerics = require('./lib/numerics');

var runtime = new Runtime();
var log = runtime.log;


var models, queue;

var WAITFOR=2;
var fcache={};
var count=0;
runtime.on('ready', function(){
  runtime.ensureQueue('hydra-raw', "raw.#", function(q){
    queue=q;
    main();
  });

  runtime.getConfig('mongo', function(err, result){
    models = new Models(result);
    main();
  })
});


/*
   @message Object {device: ,stream:, raw}
*/
function queueProcessor(message, headers, deliveryInfo) {
  var c = count++;
  if(message.hasOwnProperty('stream')
      && message.hasOwnProperty('raw')){
    var i, cv;
    var haveCV=false;
    var values = {raw: message.raw, last_raw: message.at};
    cv = currentValue(message);

    if(typeof(cv) === 'undefined' || cv === null){
      message.status='bad data';
    }
    else{
      message.cv = cv;
      message.status='ok';
      values.cv=cv;
    }
    values.status=message.status;

    update();

    function update(){
      var set = {};
      for(var key in values){
        if(values.hasOwnProperty(key)){
          set[key] = values[key];
        }
      }
      log.debug("updating these %j", set);
      models.Stream.findByIdAndUpdateWithPrevious(message.stream, 
      set, saveDone);
    }
    
      

    function saveDone(err, streams){
      if(err){return log.error(err);}
      
      if(! streams.hasOwnProperty('updated') || ! streams.hasOwnProperty('previous')){
        log.error("Something is missing in %j", streams);
        return;
      }
      
      var payload = {
        stream: streams.previous._id,
        at: new Date(),
        raw: streams.updated.raw,
        cv: streams.updated.cv,
        status: message.status,
        state: streams.updated.state,
        last_cv: streams.updated.last_cv,
        last_raw: streams.updated.last_raw,
        previous_raw: streams.previous.raw,
        previous_cv: streams.previous.cv,
        last_change: streams.updated.last_change,
        since_last_change: (new Date()) - streams.updated.last_change,
        changed_cv: streams.updated.cv !== streams.previous.cv,
        changed_raw: streams.updated.raw !== streams.previous.raw,
        update_count: c
      }

      //log.debug(c + " sending cv payload %j", payload);
      var routing = message.stream;
      runtime.publish('cv.'  + routing, payload);
      
      if(message.status !== 'ok'){
        runtime.publish('error.' + routing, payload);
      }
    } 
  }
  else{
    log.warning(c+ " bad raw:", message);
  }
}

function loadCache(callback){
  callback = callback || function(){};
  //rpc.makeRequest(exchange, 'rpc.server', {method:'getFuncCv', options:{}}, function(err, result){
  runtime.rpc.getFuncCv({}, function(err, result){
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
    queue.subscribe({prefetchCount: 1}, queueProcessor);  
  });
  
  
  setInterval(loadCache, 60000);
}