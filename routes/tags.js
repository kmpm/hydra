var storage = require('../lib/storage')
  , forms = require('../lib/forms');

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
      if(err){
        return res.send(500, err);
      }

      res.render('tags', {title:'Tags', taglist:list});  
    }
    
  });

  app.get(prefix+'new', function(req, res){
    var doc=storage.DEFAULT_TAGMETA;
    storage.saveTagMeta(doc, function(err, result){
      if(err) return res.render(500, err);
      res.redirect(prefix + doc._id + '/');
    });
  });

  app.all(prefix + ':id/', function(req, res){
    if(req.method==='POST'){
      console.log(req.body);
      load();
      // storage.saveTagMeta(req.body, function(err, result){
      //   if(err) return render(err);
      //   console.log("result:", result);
      //   load();
      // });
      
    }
    else{
      load();
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

    function load(){
      storage.getTagMeta(req.params.id, function(err, tag){
        if(err) return render(err);
        createForm(tag, render);
      });
    }
    function render(err, form){
      if(err) return res.send(500, err);
      res.render('tags/detail', {tagform: form});
    }
  });










}