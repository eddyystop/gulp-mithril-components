/* jshint node:true */
'use strict';

var gulp = require('gulp');
var gUtil = require('gulp-util');
var gClean = require('gulp-clean');
var msxLogic = require('gulp-msx-logic');
var mithrilComponents = require('./mithrilComponents');

var msx = require('./vendor/msx/msx-main');
var through = require('through2');

function msxTransform() {
  return through.obj(function (file, enc, cb) {
    try {
      file.contents = new Buffer(msx.transform(file.contents.toString()));
    }
    catch (err) {
      err.fileName = file.path;
      this.emit('error', new gUtil.PluginError('msx', err));
    }
    this.push(file);
    cb();
  });
}

console.log('test for gulp-mithril-components');

gulp.task('clean', function () {
  return gulp.src('./test/build/**.*', {read: false})
    .pipe(gClean());
});

gulp.task('components', function() {
  return gulp.src('./test/components/*.html')
    .pipe(mithrilComponents({showFiles:true}))
    .pipe(msxTransform())
    .pipe(msxLogic())
    .pipe(gulp.dest('./test/build'))
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName);
    });
});

gulp.task('msx', function() {
  return gulp.src('./test/components/*.html')
    .pipe(mithrilComponents({showFiles:true}))
    //.pipe(msxTransform())
    //.pipe(msxLogic())
    .pipe(gulp.dest('./test/msx'))
    .on('error', function(e) {
      console.error(e.message + '\n  in ' + e.fileName);
    });
});


gulp.task('test', ['clean', 'components'] /*, function () {
  require('./test/test.js');
}*/);

