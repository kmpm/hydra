var crypto = require('crypto')

var TIMEOUT=2000; //time to wait for response in ms

var METHODS=['getConfig', 'getFuncCv'];

exports = module.exports = RuntimeRpc;

function RuntimeRpc(){
  var self = this;
  this.requests = {}; //hash to store request in wait for response
  
  METHODS.forEach(function(m){
    self[m] = function(options, callback){
      self.makeRequest({method:m, options:options}, function(err, result){
        if(result.status===200){
          callback(null, result.body);
        }
        else{
          callback(result);
        }
      });
    }
  });

  process.on('message', function(m){
    //get the correlationId
    var correlationId = m.correlationId;
    //is it a response to a pending request
    if(correlationId in self.requests){
      //retreive the request entry
      var entry = self.requests[correlationId];
      //make sure we don't timeout by clearing it
      clearTimeout(entry.timeout);
      //delete the entry from hash
      delete self.requests[correlationId];
      //callback, no err
      entry.callback(null, m);
    }
  });
}

RuntimeRpc.prototype.makeRequest = function(content, callback){
  var self = this;
  //generate a unique correlation id for this call
  var correlationId = crypto.randomBytes(16).toString('hex');
  //create a timeout for what should happen if we don't get a response
  var tId = setTimeout(function(corr_id){
    //if this ever gets called we didn't get a response in a 
    //timely fashion
    callback(new Error("timeout " + corr_id));
    //delete the entry from hash
    delete self.requests[corr_id];
  }, TIMEOUT, correlationId);

  //create a request entry to store in a hash
  var entry = {
    callback:callback,
    timeout: tId //the id for the timeout so we can clear it
  };
  
  //put the entry in the hash so we can match the response later
  self.requests[correlationId]=entry;
  content.correlationId = correlationId;
  
  //send message to parent process
  process.send(content);
  
}
