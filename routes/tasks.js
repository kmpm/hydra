var taskmgr = new (require('../lib/taskmgr'));


module.exports = function (app, prefix) {

  app.all(prefix, function(req, res, next){
    res.locals.title='Tasks';
    next();
  });
  
  app.get(prefix, function(req, res){
    res.render('tasks', {tasks:taskmgr.tasks});
  });

  app.post(prefix, function(req, res){
    console.log(req.body);
    if(typeof(req.body.task) === 'undefined') return send('error', 'must have a list of tasks');
    if(typeof(req.body.action) !== 'string') return send("error", 'must have an action');
    var tasks;
    if(req.body.task instanceof Array){
       tasks = req.body.task;
    } 
    else{
      tasks = [req.body.task];
    }
    var i, task, started=[], stopped=[];
    for(i in tasks) {
      task = taskmgr.tasks[tasks[i]];
      //console.log("task %s %s:%j", i, tasks[i], task);
      if(req.body.action=='start'){
        task.start();
        started.push(task.name);
      }
      else if(req.body.action == 'stop') {
        task.stop();
        stopped.push(task.name);
      }
    }
    setTimeout(function(){
      send('ok', {started:started, stopped:stopped});
    }, 500);
    
    

    function send(status, data){
      if(req.xhr){
        var result = {status:status, data:data};  
        res.json(result);
      }
      else {
        res.send("status:" + status + ", data:" + data);
      }
    }
    
  });
}