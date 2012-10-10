
var Extend = require('./extend')
  , Logger = require('devnull');
  
var DEFAULTS = {
  mongo:{
    host:'localhost', 
    dbname: 'hydra'}, 
  amqp:{
    host:'localhost'}
}

exports.log = new Logger();
exports.config = Extend(DEFAULTS, require('../config.json'));