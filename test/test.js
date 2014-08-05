var fs = require('fs');
var files = ['test1.txt', 'test2.txt'];
var errs = 0;
console.log('gulp-msx-logic test start');

files.forEach(function (file) {
  var result = fs.readFileSync('./test/result/' + file, {encoding: 'utf8'});
  var build = fs.readFileSync('./test/build/' + file, {encoding: 'utf8'});

  var ok = result === build;
  if (!ok) errs += 1;
  console.log(file, ok ? '' : 'fails', result.length, build.length);
});

console.log('gulp-msx-logic test', errs === 0 ? 'OK' : 'FAILED ' + errs + 'times');