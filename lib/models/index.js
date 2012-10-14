var mongoose = require('mongoose'),
    User = require('./user');

var c = require('../lib/common');
var conf = c.config.get('mongo');

mongoose.connect(conf.host, conf.dbname, conf.port, {});


mongoose.connection.on("open", function(err){
  if (err) throw err;
  c.log.info("Successfully opened models");
});

exports.User = User;