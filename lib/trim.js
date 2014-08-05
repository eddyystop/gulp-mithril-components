module.exports = function trim(s) {
  var r1 = /^\s*\/\/[^\r\n]*(\r|\n|$)/;
  var r2 = /^\s*\/\*/;
  var r3 = /\*\//;

  var s2;
  while (s2 !== s) {
    s2 = s;

    var m = r1.exec(s);
    if (m) s = s.slice(m.index + m[0].length);

    m = r2.exec(s);
    if (m) {
      s = s.slice(m.index + m[0].length);
      m = r3.exec(s);
      if (m) s = s.slice(m.index + m[0].length);
    }
  }

  return s.trim();
};
