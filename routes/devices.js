var util = require('util');
var models = require('hydra-models')
  , forms = require('forms-mongoose')
  , c = require('../lib/common');



function logerr(res, err){
  c.log.warning(err);
  res.send(500, err);
}

module.exports = function(app, prefix){
  app.all(prefix, function(req, res, next){
    res.locals.title='Devices';
    next();
  });

  app.get(prefix + '*', function (req, res, next){
    next();
  });

  app.get(prefix, function(req,res){
    var query = models.Device.find({});
    query.select('_id name description datastreams._id datastreams.name');
    query.exec(render);

    function render(err, list){
      if(err) return logerr(res, err);
      res.render('devices', { devicelist:list});  
    }
  });

  // app.get(prefix+'new', function(req, res){
  //   var doc=new models.Device();
  //   doc.save(function(err, result){
  //     if(err) return logerr(res, err);
  //     res.redirect(prefix + doc._id + '/');
  //   });
  // });

  //get as specific stream
  app.get(prefix + ':id/:stream', function(req, res){
    models.Device.findOne({_id:req.params.id}, function(err, d){
      res.render('devices/stream', {stream:d.datastreams.id(req.params.stream)});
    });
  });


  /*
  * device
  * @id  ObjectID || 'new'
  */
  app.all(prefix + ':id', function(req, res){
    var action = req.query.action || 'show';
    var device_id = req.params.id;
    if(device_id === 'new') {
      action='new';
      device_id=null;
    }

    if(req.method === 'POST'){
      console.log("body", req.body);
      var f = forms.create(models.Device);
      f.handle(req, {
        success: function(form){
          console.log("success", form.data);
          if (device_id) {
            models.Device.update({_id:device_id}, {$set:form.data}, function(err){res.redirect(prefix)});
          }
          else {
            var device = new models.Device(form.data);
            device.save(function(err){res.redirect(prefix)});
          }
           
        },
        error: function(form){
          render(null, form);
        },
        empty: function(form){
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
          var f = forms.create(models.Device);
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
        callback(device);
      });
    }

    function render(err, f, device){
      if(err) return res.send(500, err);
      res.render('devices/detail', {deviceform: f, device:device, device_id:device_id});
    }
  });

  
}