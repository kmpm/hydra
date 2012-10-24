
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  //, user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var c = require('./lib/common')
  , Bus = require('./lib/bus');

var bus = new Bus();

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals.title = 'Hydra';
app.locals.usertime = function(d) {
  if(typeof(d) === 'object' && typeof(d.getMonth) === 'function')
    return d.toLocaleTimeString();
  else
    return "??:??";
}

app.get('/', routes.index);
//app.get('/users', user.list);
require('./routes/devices')(app, '/devices/');
require('./routes/tasks')(app, '/tasks/');

http.createServer(app).listen(app.get('port'), function(){
  c.log.info("Express server listening on port " + app.get('port'));
});
