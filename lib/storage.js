/* builtin and installed modules */
var mongo = require('mongodb')
 , ObjectID = mongo.ObjectID;

/* local modules */
var c = require('./common')
  , Extend = require('./Extend');

/* constants */
var DBNAME='hydra';
var MONGOHOST='bruxsvr01.mustad.se';

/* initiation */
var dbserver = new mongo.Server(MONGOHOST, 27017, {});
var db = new mongo.Db(DBNAME, dbserver, {});

var col_tagmeta;

var DEFAULT_TAGMETA={
  name: '',
  func_cv: 'function(r) {\n return r \n}',
  cosm:{enabled:false, feed:'', datastream:''}
}

db.open(function(err, db){
  c.log.info("MongoDB database '%s'is open on %s", DBNAME, MONGOHOST);
  db.collection('tagmeta', function(err, collection){
    col_tagmeta = collection;
  });
});

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
