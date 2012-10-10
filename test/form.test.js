var assert = require('assert')
  , should = require('should');
var forms = require('../lib/forms');



describe("Form", function(){

  it("render widget", function(){
    var f = new forms.Form({'test':'data'});
    for(var i in f.fields){
      var field = f.fields[i];
      field.should.have.property('render');
      field.should.have.property('widget');
      var widget = field.widget;

      widget.should.have.property('render');
      widget.should.have.property('settings');

      var result = field.render();
      result.should.equal('<input type="text" name="test" id="id_test" value="data">');
    }
  });

  it("render TextAreaWidget", function(){
    var f = new forms.Form({'test':'data'}, {widgets:
        {test:new forms.TextAreaWidget({"class":"span12"})}
      });
    for(var i in f.fields){
      var field = f.fields[i];
      field.should.have.property('render');
      field.should.have.property('widget');
      var widget = field.widget;

      widget.should.have.property('render');
      widget.should.have.property('settings');

      var result = field.render();
      result.should.equal('<textarea rows="5" cols="25" class="span12" name="test" id="id_test">data</textarea>');
    }
  });

  it("render with order", function(){
    var f = new forms.Form({'a':'dataA', 'b':'dataB'}, 
      {order:['b']});
    var fields = f.fields;
    fields.should.have.length(2);
    fields[0].name.should.equal('b');
    fields[1].name.should.equal('a');
    
  });

});