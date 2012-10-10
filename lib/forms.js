var util = require('util');
var Extend = require('./Extend');


function toArray(dic, order) {
  order = order || [];
  var result=[];
  for(var key in dic){
    result.push(dic[key]);
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

var Widget = function(){
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
  TextAreaWidget.super_.call(this, options);
  this.settings = Extend({rows: 5, cols: 25}, this.settings);
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
}

Field.prototype.render = function(){  
  return this.widget.render(this.name, this.value);
}


var Form = function(fields, options){
  this.settings = Extend({hidden: [], exclude: [], widgets:{}, order: []}, options);
  this.visible_fields={};
  this.hidden_fields={};
  for(var key in fields) {
    if(this.settings.exclude.indexOf(key)>=0)
      continue;
    var widget = new TextWidget();
    var isHidden=false;
    if(this.settings.hidden.indexOf(key)>=0){
      widget = new HiddenWidget();
      isHidden=true;
    }
    else{
      if(this.settings.widgets.hasOwnProperty(key)){
        widget = this.settings.widgets[key];
      }
    }
    var f = new Field(key, widget, fields[key]);
    

    if(isHidden){
      this.hidden_fields[key] = f;
    }
    else{
      this.visible_fields[key] = f;
    }
  }
}

Form.prototype.__defineGetter__('fields', function(){
  return toArray(this.visible_fields, this.settings.order);
});

Form.prototype.__defineGetter__('hidden', function(){
  return toArray(this.hidden_fields);
});

exports.Form = Form;
exports.TextWidget = TextWidget;
exports.HiddenWidget = HiddenWidget;
exports.TextAreaWidget = TextAreaWidget;