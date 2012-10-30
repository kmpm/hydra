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

  app.param('stream_id', function(req, res, next, id){
    c.log.debug("param stream_id = '%s'", id);
    if(id==='new'){
      found(null, new models.Stream());
    }
    else{
      models.Stream.findById(id, function(err, stream){
        found(err, stream);
      });
    }

    function found(err, stream){
      if(err) {
        next(err);
      }
      else if (stream){
        req.stream = stream;
        next();
      }
      else{
        if(id) {
          var s = new models.Stream();
          s._id = req.params.stream_id;
          req.stream = s;
          next();
        }
        else{
          next(new Error('failed to load stream'));  
        }
        
      }
    }
  });

  app.all(prefix + ':stream_id', function(req, res){

    var device_id = req.query.device_id || req.body.device_id;
    gotStream(null, req.stream)

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

  app.get(prefix + ':stream_id/history', function(req, res) {
    models.StreamHistory.find({stream: req.stream._id})
      .sort('timestamp')
      .exec(function(err, records){
        if(err) return logerr(res, err);
        gotRecords(records);
      });
    function gotRecords(records){
      if(req.is('json')){
        res.json(records);
      }
      else{
        res.render('streams/history', {stream:req.stream, records:records});
      }

    }
  });

};