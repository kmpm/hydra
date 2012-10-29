var Runtime = require('runtime');

var runtime = new Runtime();
var log = runtime.log;

var Models = require('hydra-models');

var queue, models;

var WAITFOR=2;

runtime.on("ready", function(){
  db();
  runtime.ensureQueue('hydra-historian', 'cv.#', function(q){
    queue = q;
    main();
  });
})

function db(){
  runtime.getConfig('mongo', function(err, result){
    models = new Models(result);
    main();
  });  
}


function queueProcessor(message, headers, deliveryInfo) {
  if(message.hasOwnProperty('stream')
      && message.hasOwnProperty('cv')){
    var at = message.last_cv || (new Date()).toJSON();
    var key = message.stream;

    var sh = new models.StreamHistory({stream: message.stream, timestamp:at, 
      raw:message.raw,
      cv:message.cv,
      status:message.status
    });
    
    sh.save(function(err){
      if(err) log.error(err);
    });
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