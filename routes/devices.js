var models = require('hydra-models')
  , forms = require('../lib/forms')
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
      console.log("list", list);
      res.render('devices', { devicelist:list});  
    }
  });

  app.get(prefix+'new', function(req, res){
    var doc=new models.Device();
    doc.save(function(err, result){
      if(err) return logerr(res, err);
      res.redirect(prefix + doc._id + '/');
    });
  });

  app.all(prefix + ':id/:action?', function(req, res){
    var action = req.params.action || 'show';

    if(req.method==='POST'){
      console.log("body", req.body);
      load(function(err, form){
        var obj = form.parse(req.body);
        console.log("obj", obj);
        storage.saveTagMeta(obj, function(err, result){
          if(err) return render(err);
          res.redirect(prefix);
          //load(render);
        });
        
      });
    }
    else {
      switch(action){
        case 'delete':
          models.Device.where('_id', req.params.id).remove(function(err, result){
            if(err) logerr(res, err);
            res.redirect(prefix);
          });
          break;
        default:
          load(render);
          break;
      }
      
    }
    
    function createForm(tag, callback){
      var f = new forms.Form(tag, {hidden:['_id'], exclude:['raw', 'cv', 'status'],
          widgets:{'func_cv': new forms.TextAreaWidget({"class":'span7'})},
          order:['name'],
          //exclude:['cosm']
        }
      );
      callback(null, f);
    }

    function load(callback){
      storage.getTagMeta(req.params.id, function(err, tag){
        if(err) return render(err);
        createForm(tag, callback);
      });
    }
    function render(err, form){
      if(err) return res.send(500, err);
      res.render('tags/detail', {tagform: form});
    }
  });

  
}