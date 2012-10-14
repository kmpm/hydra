var util = require('util')
  , EventEmitter = require('events').EventEmitter;

var mongo = require('mongodb')
  , ObjectID = mongo.ObjectID;


var Storage = function(options) {
  Storage.super_.call(this);
  var self = this;
  var settings = options;
  this.settings = settings;
  this.server = new mongo.Server(settings.host, settings.port);
  this.db = new mongo.Db(settings.dbname, this.server, {safe:true});
  this.col = null;
  this.db.open(function(err, db){
    if(err) throw err;
    db.collection('tagmeta', function(err, collection){
      if(err) throw err;
      collection.ensureIndex({name:1}, {safe:true, unique:true}, function(err){
        if(err) throw err;
        self.col = collection;
        self.emit("ready");
      });//ensureIndex
    });//db.collection
  });//open
}//Storage()

util.inherits(Storage, EventEmitter);

Storage.prototype.setRaw = function(name, value, callback){
  this.set(name, {raw:value},  callback);
}

Storage.prototype.getRaw = function(name, callback){
  this.col.findOne({name:name}, {fields:{_id:1, name:1, raw:1}}, callback);
}

Storage.prototype.setCV = function(name, value, callback){
  this.set(name, {cv:value},  callback);
}

Storage.prototype.set = function(name, doc, callback) {
  doc.name=name;
  var d = new Date();
  if(doc.hasOwnProperty('raw')) doc.raw_at = d;
  if(doc.hasOwnProperty('cv')) doc.cv_at = d;
  this.col.update({name:name}, {$set:doc}, {upsert: true, safe: true}, callback); 
}

module.exports = Storage;