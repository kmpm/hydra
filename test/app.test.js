var assert = require('assert')
  , should = require('should');

var request = require('supertest');

var app = require('../app');

var c = require("../lib/common");
var models = c.models;

describe("app", function(){
  var testdevice, teststream1,teststream2;
  before(function(done) {
    models.Device.removeFull({'name':'mocha3'}, create);
    function create(err) {
      var WHAT=3;
      should.not.exist(err);
      testdevice = new models.Device({name:'mocha3'});
      teststream1 = new models.Stream({name:'mocha3-1'});
      teststream2 = new models.Stream({name:'mocha3-2'});
      teststream1.save(when);
      teststream2.save(when);
      testdevice.streams.push(teststream1);
      testdevice.streams.push(teststream2);
      testdevice.save(function(err){
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

  after(function(done){
     models.Device.removeFull({'name':'mocha3'}, done);
  });

  it("locals.views", function(){
    app.locals.should.have.property('views');
    var views = app.locals.views;
    views.should.have.property('streams');
    views.should.have.property('devices');
    views.streams.should.have.property('prefix', '/streams/');
    views.devices.should.have.property('prefix');

  });

  describe("Stream", function(){
    it("GET /new", function(done){
        var url = app.locals.views.streams.prefix + 'new'
        request(app)
          .get(url)
          .expect(200, done);
    });

    it("GET /:stream_id", function(done){
        var url = app.locals.views.streams.prefix + teststream1._id
        request(app)
          .get(url)
          .expect(200, /mocha3-1/)
          .end(done);
    });

    it("POST /:stream_id + device_id", function(done){
      var url = app.locals.views.streams.prefix + teststream1._id
      request(app)
        .post(url)
        .send({name:'asdfasdf', 'device_id':testdevice._id})
        .expect(200, reload);

      function reload(err){
        should.not.exist(err);
        setTimeout(function(){
          models.Device.findById(testdevice._id, function(err, device){
            should.not.exist(err);
            device.streams.should.have.length(3);
            done();
          });
        }, 300);
      }
    });

  });//Stream

  describe("Device", function(){
    
    it('GET /', function(done){
      request(app)
        .get(app.locals.views.devices.prefix)
        .expect(200, done);
    });
    

    it('POST /', function(done){
      request(app)
        .post("/devices/")
        .expect(200, done);
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
        .get("/devices/" + testdevice._id)
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