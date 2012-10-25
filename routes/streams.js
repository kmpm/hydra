var util = require('util')
  , async = require('async');
var c = require('../lib/common')
  , Extend = require('../lib/extend')
  , models = c.models;



function logerr(res, err){
  c.log.warning(err);
  res.send(500, err);
}



module.exports = function(app, prefix){

  app.locals.views.streams = {prefix:prefix};

  app.all(prefix + ':stream_id', function(req, res){

    var device_id = req.query.device_id || req.body.device_id;
    if(req.params.stream_id !== 'new')
      models.Stream.findById(req.params.stream_id, function(err, stream){
        if(! stream){
          c.log.debug("empty stream %s", req.params.stream_id);
          stream = new models.Stream();
          stream._id = new models.Types.ObjectId(req.params.stream_id);
        }
        gotStream(err, stream);
      });
    else
      gotStream(null, new models.Stream());

    function gotStream(err, stream){
      if(err) return logerr(res, err);
      var form = models.Stream.createForm();
      if(req.method === 'POST'){
        form.handle(req, {
          success:function(form){
            var data = form.data;
            for(var key in data){
              if(data.hasOwnProperty(key)){
                stream[key] = data[key];
              }
            }
            stream.save(function(err){
              console.log("arguments=", arguments);
              if(err) return logerr(res, err);
              if(device_id){
                models.Device.findByIdAndUpdate(device_id, 
                  {$addToSet: {streams:stream._id}},
                  function(err, s){
                    if(err) return c.log.error("could not associate stream with device", err);
                    stream = s;
                    render(stream, form);
                  }
                );
              }
              else{
                render(stream, form);
              }
            });
            
          },
          error:function(form){render(stream, form);},
          empty:function(form){render(stream, form);}
        });//handle
      }
      else{
        form = form.bind(stream);       
      }
 
      render(stream, form);
    }

    function render(stream, form) {
      process.nextTick(function(){
        res.render('streams/detail', {device_id:device_id, stream:stream, form:form});
      });
    }
  });

};