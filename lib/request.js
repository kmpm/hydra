
var extend = require('./extend');


var Request = function( message /* [deliveryInfo] */ ) {
  this.params = extend({contentType:null, routingKey:''}, 
      arguments[1]);

  this.message = message;
  
}

module.exports = Request;