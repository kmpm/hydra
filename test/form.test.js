var assert = require('assert')
  , should = require('should');

var forms = require('../lib/forms');



describe("Form", function(){

  it("render widget", function(){
    var f = new forms.Form({'test':'data'});
    f.should.have.property('fields');
    f.fields.should.have.length(1);

  
    // for(var i in f.fields){
    var field = f.fields[0];
    field.should.have.property('render');
    field.should.have.property('widget');
    var widget = field.widget;

    widget.should.have.property('render');
    widget.should.have.property('settings');

    var result = field.render();
    result.should.equal('<input type="text" name="test" id="id_test" value="data">');
    // }
  });

  it("render TextAreaWidget", function(){
    var f = new forms.Form({'test':'data'}, {widgets:
        {test:new forms.TextAreaWidget({"class":"span12"})}
      });
    f.should.have.property('fields');
    f.fields.should.have.length(1);
    var result = f.fields[0].render();
    result.should.equal('<textarea rows="5" cols="25" class="span12" name="test" id="id_test">data</textarea>');
    
  });

  it("render with order", function(){
    var f = new forms.Form({'a':'dataA', 'b':'dataB'}, 
      {order:['b']});
    f.should.have.property('fields');
    var fields = f.fields;
    fields.should.have.length(2);
    fields[0].name.should.equal('b');
    fields[1].name.should.equal('a');
  });

  it("hide and show", function(){
    var f = new forms.Form({'a':'dataA', 'b':'dataB', c:'dataC'}, 
      {order:['b'], hidden:['c']});
    f.should.have.property('visible');
    f.should.have.property('hidden');
    f.visible.should.have.length(2);
    f.hidden.should.have.length(1);
    f.visible[0].name.should.equal('b');
    f.hidden[0].name.should.equal('c');
  });

  it("nested", function(){
    var f = new forms.Form({'a':{'a1':'10', 'a2':20}, 'b':'dataB', c:'dataC'}, 
      {order:['b'], hidden:['c']});

    f.visible.should.have.length(3);
    f.fields[0].should.have.property('title');
    f.fields[1].title.should.equal('a a1');
    f.fields[1].name.should.equal('a__a1');

  });

  it("parse", function(){
    var f = new forms.Form({'a':{'a1':'10', 'a2':false}, 'b':'dataB', c:'dataC'}, 
      {order:['b'], hidden:['c']});

    f.fields[0].widget.should.have.property('parse');

    var body = {a__a1:'q', a__a2:'true', b:'e'};
    var obj = f.parse(body);
    should.exist(obj);
    obj.should.have.property('a');
    obj.a.should.have.property('a1', 'q');
    obj.a.should.have.property('a2', true);
    obj.should.have.property('b', 'e');
    obj.should.have.property('c', 'dataC');
  })

});