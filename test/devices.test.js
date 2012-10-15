var assert = require('assert')
  , should = require('should');

var request = require('supertest')
  , express = require('express');

var devices = require('../routes/devices');

var app = express();
app.set('view engine', 'jade');
devices(app, '/devices/');

describe("routes/devices", function(){
  it("_wait for init", function(done){
    storage.ready(done);
  });

  describe("GET /", function(){
    it('it responds with HTML', function(done){
      request(app)
        .get("/devices/")
        .expect(200, done);
    });
  });

  // describe("GET /new", function(){
  //   it('it responds with HTML', function(done){
  //     request(app)
  //       .get("/tags/new")
  //       .expect(302, done);
  //   });
  // });

});