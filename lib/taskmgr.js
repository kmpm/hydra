var child_process = require('child_process')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , path = require('path');

var c = require('./common')
  , Api = require('./api');
var api = new Api();

var ROOTPATH = path.resolve('.');
var TASKSPATH = path.resolve(ROOTPATH, 'tasks')



var TaskMgr = function () {
  TaskMgr.super_.call(this);
  var self = this;
  this.tasks = {}
  
  process.nextTick(function(){
    self.refresh();
    self.emit("ready");  
  });
  process.on("exit", function(){
    for(key in self.tasks){
      self.tasks[key].stop();
    }
  });
}

util.inherits(TaskMgr, EventEmitter);


TaskMgr.prototype.refresh = function(){
  var dirs = fs.readdirSync(TASKSPATH);
  for(var i in dirs){
    this.parseTask(dirs[i]);
  }
}

TaskMgr.prototype.parseTask = function (folder) {
  var file = path.join(TASKSPATH, folder, 'package.json');

  if(fs.existsSync(file)){
    var r = require(file);
    r.abspath = path.join(TASKSPATH, folder, 'app.js');
    r.start = startProcessFactory(this);
    r.stop = stopProcessFactory(this);
    r.running = function(){
      if(typeof(this.process)==='undefined') return false;
      if(this.process == null) return false;
      return true;
    }
    this.tasks[r.name] = r;
  }
}

function startProcessFactory(mgr) {
  var count=0;
  function startProcess() {
    var task = this;
    count++;
    this.process = child_process.fork(this.abspath, {cwd:ROOTPATH});
    task.process.on("message", taskMessage);
    task.process.on("exit", function(code, signal){
      c.log.warning("task %s exited with code %s", task.name, code);
      delete task.process;
    });

    process.nextTick(function(){
      mgr.emit('started', task);  
    });
    
  }
  return startProcess;
}

function stopProcessFactory(mgr) {
  function stopProcess(){
    var task=this;
    if(!task.process || typeof(task.process) !== 'object') return;
    task.process.disconnect();
    task.process.kill();
    delete task.process;    
    process.nextTick(function(){
      mgr.emit('stopped', task);  
    });
  }
  return stopProcess;
}


  function taskMessage(message, sendHandle) {
    var child = this;
    c.log.debug("executing %j", message);
    var result={status:500, body: 'not implemented error', correlationId:message.correlationId};
    try{
      if(typeof(api[message.method]) !== 'function'){
        c.log.warning("missing method " + message.method);
        return child.send({status:404, body:'method not found. ' + message.method});
      }
      //otherwise
      api[message.method](message.options, function(err, body){
        c.log.debug("sending response");
        if(!err) result.status=200;

        result.body=body;
        child.send(result);
      });
    }
    catch(err){
      c.log.error("excution error", err);
      child.send(result);
    }

  }


module.exports = TaskMgr;