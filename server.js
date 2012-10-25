var http = require('http');

var app = require('./app')
  , c = require('./lib/common');

http.createServer(app).listen(app.get('port'), function(){
  c.log.info("Express server listening on port " + app.get('port'));
});