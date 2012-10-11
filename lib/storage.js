/* builtin and installed modules */
var mongo = require('mongodb')
 , ObjectID = mongo.ObjectID;

/* local modules */
var c = require('./common')
  , Extend = require('./Extend');



/* initiation */
var dbserver = new mongo.Server(c.config.mongo.host, 27017, {});
var db = new mongo.Db(c.config.mongo.dbname, dbserver, {safe:true});

var col_tagmeta;

var DEFAULT_TAGMETA = {
  name: 'noname',
  func_cv: 'function(r) {\n return r \n}',
  cosm:{enabled:false, feed:'', datastream:''}
}

exports.createTag = function(){
  return Extend(DEFAULT_TAGMETA, {})
}
var isReady=false;
db.open(function(err, db){
  if(err) {
    c.log.error(err);
    throw err;
  }
  c.log.info("MongoDB database '%s' is open on %s", c.config.mongo.dbname, c.config.mongo.host);
  db.collection('tagmeta', function(err, collection){

    collection.ensureIndex({name:1}, {safe:true, unique:true}, function(err){
      if(err){
        c.log.error("could not create index for name", err);
        throw err;
      }
    });
    col_tagmeta = collection;
    c.log.info("storage is ready");
    isReady = true;
  });
});

var ready = function (callback) {
  if(isReady){
    callback();
  }
  else {
    setTimeout(ready, 500, callback);
  }
}

exports.ready = ready;

/* api */

exports.getTagList = function (filter, callback) {
  if(typeof(callback)==='undefined') { 
    callback = filter;
    filter=undefined;
  }
  col_tagmeta.find(filter, {fields:{_id:1, name:1}}, callback);
}

exports.getTagFunctions = function(filter, callback) {
  if(typeof(callback)==='undefined') { 
    callback = filter;
    filter=undefined;
  }
  col_tagmeta.find(filter, {fields:{_id:1, name:1, func_cv:1}}, callback);
}

exports.getTagMeta = function(id, callback){
  col_tagmeta.findOne({_id:new ObjectID(id)},  function(err, doc){
    if(err) return callback(err);
    callback(null, Extend(DEFAULT_TAGMETA, doc));
  });
}

exports.saveTagMeta = function(doc, callback) {
  var source;
  if(doc.hasOwnProperty('_id')){
    source = doc._id;
  }
  doc._id = new ObjectID(source);
  col_tagmeta.update({_id: doc._id}, doc, {upsert: true, safe: true}, callback);
}
