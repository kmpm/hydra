var util = require('util');
var models = require('hydra-models')
  , c = require('../lib/common');



function logerr(res, err){
  c.log.warning(err);
  res.send(500, err);
}

module.exports = function(app, prefix){

  app.locals.new_stream = function(){
    console.log("new_stream");
    var d = new models.Device();
    return d.streams.create();
  }

  app.all(prefix, function(req, res, next){
    res.locals.title='Devices';
    next();
  });

  app.get(prefix + '*', function (req, res, next){
    next();
  });

  app.get(prefix, function(req,res){
    var query = models.Device.find({});
    query.select('_id name description streams._id streams.name');
    query.exec(render);

    function render(err, list){
      if(err) return logerr(res, err);
      res.render('devices', { devicelist:list});  
    }
  });


  /*
  * device
  * @id  ObjectID || 'new'
  */
  app.all(prefix + ':id', function(req, res){
    var action = req.query.action || 'show';
    var device_id = req.params.id;
    c.log.debug("_id:%s, action=%s", device_id, action);
    if(device_id === 'new') {
      action='new';
      device_id=null;
    }

    if(req.method === 'POST'){
      console.log("body", req.body);
      var f = models.Device.createForm();
      f.handle(req, {
        success: function(form){
          if (device_id) {
            models.Device.update({_id:device_id}, {$set:form.data}, function(err){res.redirect(prefix)});
          }
          else {
            var device = new models.Device(form.data);
            device.save(function(err){res.redirect(prefix)});
          }
           
        },
        error: function(form){
          c.log.warn("error in saving form");
          render(null, form);
        },
        empty: function(form){
          c.log.warn("empty form");
          render(null, form);
        }
      });
    }
    else {
      switch(action){
        case 'delete':
          models.Device.where('_id', device_id).remove(function(err, result){
            if(err) logerr(res, err);
            res.redirect(prefix);
          });
          break;
        case 'new':
          var f = models.Device.createForm();
          render(null, f);
          break;
        default:
          load(render);
          break;
      }
      
    }
    
    function load(callback){
      models.Device.findOne({_id:device_id}, function(err, device){
        if(err) return render(err);
        var f = models.Device.createForm();
        f = f.bind(device);
        callback(null, f, device);
      });
    }

    function render(err, f, device){
      if(err) return res.send(500, err);
      var action='.';
      if(device_id === null) action='./new';
      res.render('devices/detail', {deviceform: f, action:action, device:device, device_id:device_id});
    }
  });

  //get as specific stream
  app.all(prefix + ':device_id/:stream_id', function(req, res){
    c.log.debug("get specific stream");
    models.Device.findOne({_id:req.params.device_id}, function(err, device){
      if(err){
        c.log.warning("did not find device %s", req.params.device_id, err);
      }
      var stream;
      var f = models.Device.createStreamForm();
      if(req.params.stream_id === 'new'){
        stream = device.streams.create();
        render(stream, f);
      }
      else {
        stream = device.streams.id(req.params.stream_id);
        if(req.method === 'POST'){
          f.handle(req, {
            success:function(form){
              var data = form.data;
              if(stream === null){
                stream = {_id:req.params.stream_id};
                device.streams.push(stream);
                stream = device.streams.id(req.params.stream_id);
              }
              for(var key in data){
                if(data.hasOwnProperty(key)){
                  stream[key] = data[key];
                }
              }
              console.log("stream=", stream);
              //possibly do a update instead of save
              device.save();
              done("success", form);
            },
            error:function(form){done("error", form);},
            empty:function(form){done("empty", form);}
          });
          function done(msg, form){
            console.log(msg);
            render(stream, form);
          }
        }
        else{
          render(stream, f);
        }
      }
    });//findOne

    function render(stream, form){
      try{
        if(form.hasOwnProperty("bind")){
          form = form.bind(stream);
        }
      }
      catch(err){
        c.log.error("binding error %j", stream);
        throw err;
      }
      res.render('devices/stream', {stream:stream, form:form});  
    }
  });

  
  
}