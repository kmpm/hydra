

var Runtime = require('runtime');
var runtime = new Runtime();

var Models = require('hydra-models');


var WAITFOR=2;
var models, streams;

var log = runtime.log;

runtime.on('ready', function(){
  openDb();
  main();
  
});
function openDb(){
  runtime.getConfig('mongo', function(err, result){
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
}



function genRandNum() {
  //return 5;
  return (Math.floor(Math.random() * 20) + 1).toString();

}


function main(){
  WAITFOR=-1;
  if(WAITFOR > 0 ) return;

  setInterval(function(){
    streams.forEach(function(stream){
      var value = genRandNum();
      runtime.publish('raw.' + stream._id, {
        stream: stream._id, 
        at: Date.now(), 
        raw: value});
      log.debug("puslished %s for %s", value, stream._id);
    });
    
  }, 15000);
}