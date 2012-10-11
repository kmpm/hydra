
var Extend = require('./extend')
  , Logger = require('devnull');
  
var DEFAULTS = {
  mongo:{
    host:'localhost', 
    dbname: 'hydra'}, 
  amqp:{
    host:'localhost',
    vhost:'/',
    exchange:'hydra.topic'
  }
}

exports.log = new Logger();
exports.config = Extend(DEFAULTS, require('../config.json'));