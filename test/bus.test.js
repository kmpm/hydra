var assert = require('assert')
  , should = require('should');


var exchange;
var Bus = require('../lib/bus');
var bus;

describe("Bus", function(){
  before(function(done){
    bus = new Bus();
    bus.on("ready", function(){
      exchange = bus.exchange;
      done();
    });
  });

  after(function(done){
    setTimeout(function(){
      bus.end();
      done();
    },700);
    
  });

  it("is online", function(){
    should.exist(bus);
    bus.should.have.property('_subscriber');
    bus.should.have.property('exchange');
  });

  describe("Messages", function(){
    before(function(done){
      exchange.publish("rpc.server.test", {method:'getFuncCv', options:{}}, 
        {correlationId:Date.now().toString(), replyTo: 'hydra-test'}, function(err){
        if(err) console.log(err);

      });
      done();
      
    });
  

    it("wait for execution", function(done){
      var first=true;
      this.timeout(5000);
      bus.on('executed', function(message, reply){
        if (!first) return;
        process.nextTick(function(){
          message.should.have.property('method');
          message.should.have.property('options');
          reply.should.have.property('status');
          reply.should.have.property('body');
          done();  
        });
        
      });
    });
  });
});