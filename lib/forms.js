var util = require('util');
var Extend = require('./Extend');


function toArray(arr, hidden, order) {
  order = order || [];
  var result=[];
  for(var i in arr){
    if (arr[i].hidden === hidden) {
      result.push(arr[i]);
    }
  }
  if(order.length > 0){
    order = order.reverse();
    result.sort(function(a, b){
      if(order.indexOf(a.name) > order.indexOf(b)) return -1;
      if(order.indexOf(b.name) > order.indexOf(a)) return 1;
      return 0;
    });
  }
  return result;
}

var Widget = function() {
  this.settings = Extend({}, arguments[0]);
}

var TextWidget = function() {
  TextWidget.super_.call(this);
};

util.inherits(TextWidget, Widget);

TextWidget.prototype.render = function(name, value){
  var id = "id_" + name;
  return util.format('<input type="text" name="%s" id="%s" value="%s">', name, id, value);
}


var HiddenWidget = function(){
  HiddenWidget.super_.call(this);
}

util.inherits(HiddenWidget, Widget);

HiddenWidget.prototype.render = function(name, value){
  var id = "id_" + name;
  return util.format('<input type="hidden" name="%s" id="%s" value="%s">', name, id, value);
}


var TextAreaWidget = function(options) {
  TextAreaWidget.super_.call(this);
  this.settings = Extend({rows: 5, cols: 25}, options);
}
util.inherits(TextAreaWidget, Widget);

TextAreaWidget.prototype.render = function(name, value) {
  var id = "id_" + name;
  var extra = ""
  for(var key in this.settings){
    extra += key + '="' + this.settings[key] + '" ';
  }
  return '<textarea ' + extra + 'name="' + name + '" id="' + id + '">' + value + '</textarea>';
}


var Field = function(key, widget, value){
  this.name=key;
  this.widget=widget;
  this.value=value;
  this.hidden=false;
}

Field.prototype.render = function(){  
  return this.widget.render(this.name, this.value);
}



var Form = function(initial, options){
  this.settings = Extend({hidden: [], exclude: [], widgets:{}, order: []}, options);
  this.fields=[];
  var f, key;
  for(key in initial) {
    f = _createField(this.settings, key, initial[key]);
    if(f) this.fields=this.fields.concat(f);
  }
  this.fields = this._sort(this.fields);
}

Form.prototype._sort = function(arr) {
  if(this.settings.order.length > 0){
    var order = this.settings.order.reverse();
    arr.sort(function(a, b){
      if(order.indexOf(a.name) > order.indexOf(b)) return -1;
      if(order.indexOf(b.name) > order.indexOf(a)) return 1;
      return 0;
    });
  }
  return arr;
}

Form.prototype.__defineGetter__('visible', function(){
  return toArray(this.fields, false, this.settings.order);
});

Form.prototype.__defineGetter__('hidden', function(){
  return toArray(this.fields, true);
});

function _createField(settings, name, value) {
  if(settings.exclude.indexOf(name)>=0) return null;
  var widget = new TextWidget(); //default must be something at least
  
  var isHidden=false;
  if(settings.hidden.indexOf(name)>=0){
    widget = new HiddenWidget();
    isHidden=true;
  }
  else{
    if(settings.widgets.hasOwnProperty(name)){
      widget = settings.widgets[name];
    }
  }

  var field = new Field(name, widget, value);
  field.hidden = isHidden;
  return [field];
}

exports.Form = Form;
exports.TextWidget = TextWidget;
exports.HiddenWidget = HiddenWidget;
exports.TextAreaWidget = TextAreaWidget;