var assert = require('assert')
  , should = require('should');

var c = require('../lib/common');


describe("common", function(){
  it("should have config", function(){
    c.should.have.property('config');

    var config = c.config;
    config.should.have.property('get');
    config.get('testing').should.equal(true);
  });

  it("should have log", function(){
    c.should.have.property('log');
    

  });
});