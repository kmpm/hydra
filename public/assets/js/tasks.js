
var actions = {
  start:function(button, callback){
    $.post('.', 
      with_tasks('start'),
      function(data){
        $('.results').html(data.data);
        if(data.status=='ok') location.reload(true);
        callback();    
      });
  },
  stop:function(button, callback){
    $.post('.', 
      with_tasks('stop'),
      function(data){
        $('.results').html(data.data);
        if(data.status=='ok') location.reload(true);
        callback();
      });
  },
  restart:function(button, callback){
    $.post('.', 
      with_tasks('restart'),
      function(data){
        $('.results').html(data.data);
        if(data.status=='ok') location.reload(true);
        callback();
      });
  },

  "refresh-tasks":function(button, callback){
    window.location = document.location.href + "?action=refresh"
    callback(); 
  }

}

$(document).ready(function(){
  $('body').actionbutton({actions:actions});
});




function with_tasks(action){
  var tasks = $('#tasks').serialize();
  tasks += "&action=" + action;
  return tasks;
}