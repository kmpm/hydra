var assert = require('assert')
  , should = require('should');

var TaskMgr = require('../lib/taskmgr');
var taskmgr;


describe("taskmgr", function(){
  before(function(done){
    this.timeout(5000);
    taskmgr = new TaskMgr();
    taskmgr.on("ready", function(){
      console.log("taskmgr ready");
      done();
    });
  });

  it("should have task named foo", function(done){
    this.timeout(7000);
    taskmgr.should.have.property('tasks');
    taskmgr.tasks.should.have.property('foo');
    console.log("before start");
    taskmgr.tasks.foo.start();
    
    taskmgr.on("started", function(task){
      should.exist(task);
      task.should.have.property('name');
      task.should.have.property('process');
      
      setTimeout(function(){
        console.log("before stop");
        task.stop();
      }, 5000);
    });
    
    taskmgr.on("stopped", function(task){
      should.exist(task);
      task.should.have.property('name');
      task.should.not.have.property('process');
      done();
    });
  })
})