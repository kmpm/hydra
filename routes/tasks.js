var child_process = require('child_process');

var tasklist = [
  {name:'cv', status:'not running'}
];

module.exports = function (app, prefix) {
  
  app.get(prefix, function(req, res){
    res.render('tasks', {tasklist:tasklist});
  });

  app.get(prefix + ':task/:action', function(req, res) {
    var task = tasklist[0];

    var child = child_process.fork('./tasks/cv', {cwd:'./'});
    task.process = child;
    task.status = child.pid;
    res.redirect(prefix);
  });
}