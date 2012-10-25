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

  app.locals.views.devices = {prefix:prefix};

  app.locals.new_stream = function(){
    console.log("new_stream");
    var d = new models.Device();
    return d.streams.create();
  }

  app.all(prefix, function(req, res, next){
    res.locals.title='Devices';
    next();
  });

  app.all(prefix, function(req,res){
    var template='devices';
    if(req.xhr){
      template='devices/devicelist';
      models.Device.find({})
        .populate('streams')
        .exec(function(err, list){
        render(err, {devicelist:list});
      });
    }
    else {
      render(null);
    }
   

    function render(err, extra){
      if(err) return logerr(res, err);
      var payload =  Extend({xhr:req.xhr}, extra);
      res.render(template, payload);  
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
      if(! req.body)
        c.log.warning("no form body");
      console.log("body", req.body);
      var f = models.Device.createForm();
      f.handle(req, {
        success: function(form){
          if (device_id) {
            models.Device.update({_id:device_id}, {$set:form.data}, function(err){res.redirect(prefix)});
          }
          else {
            var device = new models.Device(form.data);
            device.save(function(err){res.redirect(prefix +  device._id)});
          }
           
        },
        error: function(form){
          c.log.warning("error in saving form");
          render(null, form);
        },
        empty: function(form){
          c.log.warning("empty form");
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
      var query = models.Device.findOne({_id:device_id})
      .exec(function(err, device){
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


  
  
}