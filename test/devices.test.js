var assert = require('assert')
  , should = require('should');

var request = require('supertest')
  , express = require('express');

var devices = require('../routes/devices');

var app = express();
app.locals.title = "test";
app.set('view engine', 'jade');
devices(app, '/devices/');

describe("routes/devices", function(){
  

  it("_wait for init", function(done){
    done();
  });

  describe("GET /", function(){
    it('it responds with HTML', function(done){
      request(app)
        .get("/devices/")
        .expect(200, done);
    });
  });

  describe("POST /", function(){
    it('it responds with HTML', function(done){
      request(app)
        .post("/devices/")
        .expect(200, done);
    });
  });

  describe("/:id", function(){
    it("POST /'new'", function(done){
      request(app)
        .post("/devices/new")
        .expect(200, /!error_msg/)
        .end(function(err, res){
          if(err) return done(err);
          //console.log(res.text);
          done();
        });
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