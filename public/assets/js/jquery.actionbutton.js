
(function( $ ) {
  $.fn.actionbutton = function(options) {
  
    var settings = $.extend({
      'actions': {}
    }, options);

    // Do your awesome plugin stuff here
    this.on('click', '.btn', button_handler);
    function button_handler(e) {
      
      function done(err) {
        $button.button('reset');
      }

      var actions = $(this).data('actions');
      console.log(actions);
      var $button=$(this);
      $button.button('loading');
      if(typeof(actions) !== 'undefined'){
        performActions(actions, $button, done);
      }
      else done(null);

      
    }//button handler


    function performActions(actions, button, callback) {
      //split and loop if more than 1
      var arr = actions.split("+");
      var i=0;
      pa();
      function pa(){
        performAction(arr[i], button, function(err){
          i+=1;
          if(i<arr.length && !err){
            pa();
          }
          else{
            callback(err);
          }
        });
      }
    }//performActions

    function performAction(action, button, callback){
      if(action in settings.actions){
        console.log("performAction(" + action + ")");
        settings.actions[action](button, done);
      }
      else{
   
        done("action '" + action + "' is not supported!");
      }

      function done(err){
        if(err){
          console.log("performAction(" + action + ") ERROR! :" + err);
        }
        else {
          console.log("performAction(" + action + ") OK!");
        }
        //do stuff
        if(typeof(callback) !== 'undefined'){
          callback(err);
        }
      }
    }//performAction
  };
})( jQuery );





