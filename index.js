var mongo = require('mongodb');
var amqp = require('amqp');
var util = require('util');
var assert = require('assert');

var dbserver = new mongo.Server("127.0.0.1", 27017, {});
var db = new mongo.Db('hydra', dbserver, {});

var connection = amqp.createConnection({host:'hydra.mustad.se', vhost:'Factory'});

var Request = require('./lib/request')
  , Response = require('./lib/response');

var red, blue, reset;
red   = '\u001b[31m';
blue  = '\u001b[34m';
green = '\u001b[32m';
reset = '\u001b[0m';



connection.on('ready', function(){
  console.log('connected');
  connection.queue('my-queue', {durable:true, autoDelete:false}, useQueue);

});


var ensureCollection = function (name, callback) {
  db.open(function(err, p_client){
    if(err) return callback(err);
    db.collection(name, callback);
  });
}

var ensureBinding = function (q) {
  q.bind('factory.topic', '#');
  console.log("queue bound");
}

var subscribe = function (q, next) {
  q.subscribe(listener);
  console.log("subscribing to queue");

  function listener(message, headers, deliveryInfo) {
    var status="Unknown";
    var doc = message;
    try{
      if(typeof(message) !== 'object' ){
        doc = JSON.parse(message);
      }
      else{
        assert.ok(doc.hasOwnProperty('model'), "missing root model");
        assert.equal(doc.model, "envelope");
      }
      status = 'OK';
    }
    catch(err){
      status=err;
    }

    var color=red;
    if(status='OK')
      color=green;
    
    if(status !== 'OK'){
      console.log("%s%s\u001b[0m,\t type=%s,\t routingKey=%s", color, status, typeof(message),  deliveryInfo.routingKey);
      console.log(util.inspect(message, true, null, true));
      console.log("");
    }
    else {
      var req = new Request(doc, deliveryInfo);
      var res = new Response(req);
      next(req, res);
    }
  }
}



var useQueue = function (q) {
  console.log("got queue");
  ensureCollection('log', function(err, col){

    function saveAs(req, res){
      col.insert({routingKey: req.params.routingKey, 
        received_at: new Date(),
        message: req.message
        });
    }

    ensureBinding(q);
    subscribe(q, saveAs);
  });
  
}
