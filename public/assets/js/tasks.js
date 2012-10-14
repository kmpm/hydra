
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