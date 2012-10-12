


exports.ToSigned16 = function (x) {
  var a = new Uint16Array(1);
  a[0]=x;
  var b = new Int16Array(a.buffer);
  return b[0];
}


