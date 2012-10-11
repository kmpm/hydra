var storage = require('../lib/storage')
  , forms = require('../lib/forms')
  , c = require('../lib/common');


function logerr(res, err){
  c.log.warning(err);
  res.send(500, err);
}

module.exports = function(app, prefix){

  app.get(prefix + '*', function (req, res, next){
    next();
  });

  app.get(prefix, function(req,res){
    storage.getTagList(function(err, cursor){
      if(err){
        return res.send(500, err);
      }
      cursor.toArray(render);
    });
    function render(err, list){
      if(err) return logerr(res, err);
      res.render('tags', {title:'Tags', taglist:list});  
    }
  });

  app.get(prefix+'new', function(req, res){
    var doc=storage.createTag();
    storage.saveTagMeta(doc, function(err, result){
      if(err) return logerr(res, err);
      res.redirect(prefix + doc._id + '/');
    });
  });

  app.all(prefix + ':id/', function(req, res){
    if(req.method==='POST'){
      console.log("body", req.body);
      load(function(err, form){
        var obj = form.parse(req.body);
        console.log("obj", obj);
        storage.saveTagMeta(obj, function(err, result){
          if(err) return render(err);
          load(render);
        });
        
      });
    }
    else{
      load(render);
    }
    
    function createForm(tag, callback){
      var f = new forms.Form(tag, {hidden:['_id'], 
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