var child_process = require('child_process')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , path = require('path');

var c = require('./common');

var ROOTPATH = path.resolve('.');
var TASKSPATH = path.resolve(ROOTPATH, 'tasks')


var TaskMgr = function () {
  TaskMgr.super_.call(this);
  var self = this;
  this.tasks = {}
  var dirs = fs.readdirSync(TASKSPATH);
  for(var i in dirs){
    this.parseTask(dirs[i]);
  }
  process.nextTick(function(){
    self.emit("ready");  
  });
  process.on("exit", function(){
    for(key in self.tasks){
      self.tasks[key].stop();
    }
  });
}

util.inherits(TaskMgr, EventEmitter);


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

module.exports = TaskMgr;