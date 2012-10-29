var util = require('util');
var Api = require('./api');

exports = module.exports = Rpc;

var ERR_INVALID_JSONRPC = {code:-32600, message:"Invalid Request"};
var ERR_INVALID_PARAMS = {code:-32602, message:"Invalid Params"};
var ERR_MISSING_METHOD = {code:-32601, message:"Method not found"}


function Rpc () {
  //Rpc.super_.call(this);
  this.api = new Api();
}

/*
 * 
 * @callback - function(response)
 */

Rpc.prototype.execute = function(req, callback) {
  var self = this;
  var isNotification = true; //is this a notification or not

  if(req.hasOwnProperty('id')) {
    if(typeof(req.id) === 'object') 
      return callback(self.makeError(req, ERR_INVALID_JSONRPC, 'id'));
    //TODO: validate that id is to spec
    isNotification = false;
  }

  if(! req.hasOwnProperty('jsonrpc') && req.jsonrpc !== '2.0') {
    return callback(self.makeError(req, ERR_INVALID_JSONRPC, 'jsonrpc'));
  }

  if(! req.hasOwnProperty('method')) {
    return callback(self.makeError(req, ERR_INVALID_JSONRPC, 'method'));
  }

  if(req.hasOwnProperty('params')){
    if(typeof(req.params) !== 'object') {
      return callback(self.makeError(req, ERR_INVALID_JSONRPC, 'params'));
    }
  }

  if(typeof(self.api[req.method]) !== 'function'){
    return callback(self.makeError(req, ERR_MISSING_METHOD, req.method));
  }

  try {
    self.api[req.method](req.params, function(err, result){
      if(err){
        return callback(self.makeError(req, {code:-100001, message:"Undefined method error", data:err}));
      }else{
        return callback(self.makeResult(req, result));
      }
    });
  }
  catch(err){
    return callback(this.makeError(req, {code:-10000, message:"Undefined api error", data:err}));
  }

}

Rpc.prototype.makeResult = function (req, result) {
  var res = {
    jsonrpc:"2.0",
    result:result,
    id:req.id
  };
  return res;
}

Rpc.prototype.makeError = function (req, error, data) {
  // {code: message: data:}
  if(typeof(error) === 'numeric'){
    error={code:error, message:''};
  }
  if(data) error.data=data;
  var res = {
    jsonrpc:"2.0",
    error:error,
    id:req.id
  };
  return res;
}