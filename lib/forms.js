var util = require('util');
var Extend = require('./Extend');


var what = function(val){
  //http://blog.niftysnippets.org/2010/09/say-what.html
  //"[object Object]"
  return val.constructor.name;
}

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

function Widget() {
  this.settings = Extend({}, arguments[0]);
}

Widget.prototype.parse = function (value){
  return value;
}

function TextWidget() {
  Widget.call(this);
};

util.inherits(TextWidget, Widget);


TextWidget.prototype.render = function(name, value){
  var id = "id_" + name;
  return util.format('<input type="text" name="%s" id="%s" value="%s">', name, id, value);
}


function HiddenWidget(){
  HiddenWidget.super_.call(this);
}

util.inherits(HiddenWidget, Widget);

HiddenWidget.prototype.render = function(name, value){
  var id = "id_" + name;
  return util.format('<input type="hidden" name="%s" id="%s" value="%s">', name, id, value);
}

function BoolWidget() {
  BoolWidget.super_.call(this);
}

util.inherits(BoolWidget, Widget);

BoolWidget.prototype.render = function (name, value) {
  var id = "id_" + name;
  var extra ="";
  if(value){
    extra ='checked="checked" ';
  }
  return util.format('<input type="checkbox" name="%s" id="%s" value="true" ' + extra + '>', name, id);
}

BoolWidget.prototype.parse = function(value) {
  return value === 'true';
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


var Field = function(key, title, widget, value){
  this.name=key;
  this.title=title;
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

Form.prototype.parse = function (body) {
  var field, parts, i,j, value, part;
  var obj={part:{}};
  
  for(i in this.fields){
    field = this.fields[i];
    part = obj.part;
    if(body.hasOwnProperty(field.name)){
      try{
        value = field.widget.parse(body[field.name]);  
      }
      catch(ex){
        console.error("unable to parse the value '%s' for field %s", body[field.name], field.name);
        console.log("apa", what(field), typeof(field));
        throw ex;
      }
    }
    else{
      value = field.value;
    }
    parts = field.name.split('__');
    for(j in parts){
      if(part.hasOwnProperty(parts[j])){
        if(j == parts.length-1){
          part[parts[j]]=value;
        }
        else {
          part = part[parts[j]];
        }          
      }
      else {
        if(j == parts.length-1){
          part[parts[j]]=value;
        }
        else{
          part[parts[j]]={};
          part = part[parts[j]];
        }
      }
    }
  }
  return obj.part;
}

function _createField(settings, name, value) {
  if(settings.exclude.indexOf(name)>=0) return null;
  var fields=[];
  var key;
  
  var widget = new TextWidget(); //default must be something at least
  if(typeof(value) === 'boolean')
    widget = new BoolWidget();
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
  if(typeof(value) === 'object' && !isHidden /*TODO: check for usual types */){
    for(key in value){
      if(value.hasOwnProperty(key)){
        fields= fields.concat(_createField(settings, name + '__' + key, value[key]));
      }
    }
    return fields;
  }

  var field = new Field(name, name.replace('__', ' '), widget, value);
  field.hidden = isHidden;
  return [field];
}

exports.Form = Form;
exports.TextWidget = TextWidget;
exports.HiddenWidget = HiddenWidget;
exports.TextAreaWidget = TextAreaWidget;