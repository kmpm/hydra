

var Runtime = require('runtime');

var runtime = new Runtime();
var log = runtime.log;

var FROZEN_MINUTES=15;

runtime.on("ready", function(){
  //first after 5 seconds
  setTimeout(checkFrozen, 5000);
  setTimeout(checkLive, 5000);
  //then every minute
  setInterval(checkFrozen, 58*1000);
  setInterval(checkLive, 60*1000);
});


// function updateToFrozen(){
//   var d = new Date();
//   d.setMinutes(d.getMinutes()-FROZEN_MINUTES);
//   var options= {};
//   options.conditions:{last_change: {$lt:d}, state:{$ne:"frozen"};
//   options.update = :{$set:{state:'frozen'}}
//   runtime.rpc.streamUpdate(options, function(err, result){
//     log.debug("update was ok %j", result);
//   });
// }


function checkLive(){
  var d = new Date();
  d.setMinutes(d.getMinutes()-FROZEN_MINUTES);
  runtime.rpc.streamFind({last_change: {$gt:d}, state:{$ne:"live"}}, function(err, result){
    if(err) return log.error(err);
    log.debug("bunch of live... %s", result.length);
    result.forEach(function(r){updateState(r, 'live')});
  });
}

function checkFrozen(){
  var d = new Date();
  d.setMinutes(d.getMinutes()-FROZEN_MINUTES);
  runtime.rpc.streamFind({last_change: {$lt:d}, state:{$ne:"frozen"}}, function(err, result){
    if(err) return log.error(err);
    log.debug("bunch of frozen... %s", result.length);
    result.forEach(function(r){updateState(r, 'frozen')});
  });
}

function updateState(r, state){
  runtime.rpc.streamUpdate({
      conditions:{_id:r._id}, 
      update:{$set:{state:state}}}, function(err, result){
    if(err) return log.error(err);
    log.debug("update was ok %j", result);
    runtime.publish('statechange.' + r._id + '.' + state, {
      stream:r._id,
      to_state:state
    });
  });  
}
