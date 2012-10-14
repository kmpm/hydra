

var amqp = require('amqp')
  , Logger = require('devnull');
var log = new Logger();

var nconf = require('nconf');
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
nconf.argv()
  .file('config.json')
  .defaults(DEFAULTS);

var mq = amqp.createConnection(nconf.get("amqp"));
var exchange;


mq.on("ready", function(){
  log.info("mq is ready");
  ensureExchange(function(ex){
    exchange=ex;
    main();
  });
});


function ensureExchange(callback){
  mq.exchange(nconf.get("amqp:exchange"), {type:'topic', durable:true}, callback);
}


function genRandNum() {
  return (Math.floor(Math.random() * 90000) + 10000).toString();
}


function main(){
  WAITFOR=-1;
  if(WAITFOR > 0 ) return;

  setInterval(function(){
    exchange.publish('raw.sim.foo.bar', {key:'sim.foo.bar', at:Date.now(), raw:genRandNum()})
  }, 15000);
}