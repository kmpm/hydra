
var Extend = require('./extend')
  , Logger = require('devnull')
  , nconf = require('nconf');
  

var Models = require('hydra-models');

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

exports.models = new Models(nconf.get("mongo"));

function Config() {

}

Config.prototype.get = function(key){
  return nconf.get(key);
}

Config.prototype.set = function(key, value){
  nconf.set(key, value);
}

exports.log = new Logger();
exports.config = new Config();