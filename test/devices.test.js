var assert = require('assert')
  , should = require('should');

var request = require('supertest')
  , express = require('express');

var devices = require('../routes/devices');

var app = express();
app.use(express.bodyParser());
app.locals.title = "test";
app.set('view engine', 'jade');
devices(app, '/devices/');

var c = require("../lib/common");
var models = c.models;

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
    var d,s1,s2;
    before(function(done) {
      models.Device.find({'name':'mocha3'}).remove(create);
      function create(err) {
        var WHAT=3;
        should.not.exist(err);
        d = new models.Device({name:'mocha3'});
        s1 = new models.Stream({name:'1'});
        s2 = new models.Stream({name:'2'});
        s1.save(when);
        s2.save(when);
        d.streams.push(s1);
        d.streams.push(s2);
        d.save(function(err){
          should.not.exist(err);
          when();
        });
        function when(err){
          should.not.exist(err);
          WHAT--;
          if(WHAT >0) return;
          done();
        }
      }
    });

    it("POST /'new'", function(done){
      request(app)
        .post("/devices/new")
        .send({name:'device-test'})
        .expect(302)
        .expect('location', /\/devices\/[0-9A-Fa-f]{24}$/)
        .end(function(err, res){
          console.log("location=", res.header.location);
          done();
        });
    });

    it("GET /'ObjectID'", function(done){
      request(app)
        .get("/devices/" + d._id)
        .expect(200, done);
    });

    describe("/:device_id/:stream_id", function(){
      it("GET", function(done){
          request(app)
            .get('/devices/' + d._id + "/" + s1._id)
            .expect(200, done);
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