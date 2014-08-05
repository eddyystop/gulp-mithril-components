/* jshint node:true */
// This code is based on https://github.com/ng-vu/gulp-include-js . Much thanks!
'use strict';
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var trim = require('./lib/trim');

//var pluginName = 'mithril-components-html';
var magenta = gutil.colors.magenta;
var cyan = gutil.colors.cyan;

var caches = {};

function include(options) {
  options = options || {};
  options.keyword = options.keyword || 'INCLUDE';
  options.cache = options.cache || false;
  options.showFiles = typeof options.showFiles === 'string' ?
    options.showFiles : (options.showFiles ? 'mithril-components:' : false);
  if (options.recursive === undefined) options.recursive = true;

  return through.obj(function(file, enc, cb) {
    var self = this;
    var jsFile;

    this.base = file.base || file.cwd;
    this.filepath = file.path;
    this.id = path.relative(this.base, this.filepath);
    this.options = options;
    this.includes = {};

    /*
    if (options.cache) {
      var cachename = options.cache === true? 'default': options.cache;
      caches[cachename] = caches[cachename] || {
        includes: {},
        modules: {}
      };
      this.cacheIncludes = caches[cachename].includes;
      this.cacheModules = caches[cachename].modules;
    }
    */

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) throwError('Streaming not supported');

    /*
    // ignore _* files
    var filename = path.basename(file.path);
    if (filename[0] === '_') return cb();
    */
    /*
    // check if file was cached
    if (options.cache && !isDirty(file.path, this.cacheModules, this.cacheIncludes)) {
      return cb();
    }
    */

    var str = file.contents.toString();
    str = makeComponent(str, this.id, [this.filepath]);
    /*
    try {
      var str = file.contents.toString();
      str = makeComponent(str, this.id, [this.filepath]);
    } catch(e) {
      this.emit('error', e);
      return cb();
    }
    */

    file.contents =
      new Buffer(str);

    /*
    // save to cache
    if (options.cache) this.cacheModules[file.path] = {
      time: time(file.path),
      includes: this.includes
    };
    */
    if (options.showFiles) {
      gutil.log(options.showFiles, magenta(path.relative(file.cwd, file.path)));
    }

    file.path = gutil.replaceExtension(file.path, '.js');
    this.push(file);
    cb();

    // handle the <!==js:
    function makeComponent (html, id, stack) {
      var regex = new RegExp('^\<\!--js: (.+) --\>', 'i');
      var m = html.match(regex);

      if (!m) throwError(file.path, ': no JS file specification.');
      if (!m[1])throwError(file.path, ': no JS file specified.');

      jsFile = m[1];
      if (jsFile[0] === '.') jsFile = path.join(self.base, jsFile);

      str = readIncFile(jsFile);
      str = str.replace(/COMPONENT_NAME/g, path.basename(file.path, '.html'));
      str = insertMixins(str, html);
      return exec(str, self.id, [self.filepath]);
    }

    // handle MIXIN
    function insertMixins (str, html) {
      var mixinRegex = new RegExp('(//[^\r\n]*)?([^\\s]+[ \\t\\v]*)?' + 'MIXIN' + '\\s*\\( *[\'"]([^\'"]*)[\'"]\\s*\\)');
      var result = '';

      var m = mixinRegex.exec(str);
      while (m) {
        var isComment = m[1];
        var inline = m[2];
        var mixinName = m[3];

        result += str.slice(0, m.index) + (isComment ? m[0] : ((inline || '') + extractMixin(html, mixinName)));

        str = str.slice(m.index + m[0].length);
        m = mixinRegex.exec(str);
      }

      return result + str;
    }

    // handle INCLUDE
    function exec(str, id, stack) {
      var r = new RegExp('(//[^\r\n]*)?([^\\s]+[ \\t\\v]*)?' + options.keyword + '\\s*\\( *[\'"]([^\'"]*)[\'"]\\s*\\)');
      var result = '';

      var m = r.exec(str);
      while (m) {
        var isComment = m[1];
        var inline = m[2] || '';
        var relativePath = m[3];
        var mixinName = '';

        var i = relativePath.indexOf(':');
        if (i !== -1) {
          mixinName = relativePath.substr(i + 1);
          relativePath = relativePath.substr(0, i);
        }
        if (relativePath[0] === '.') relativePath = path.join(path.join(path.dirname(id), relativePath));

        result += str.slice(0, m.index);
        if (isComment) {
          result += m[0];
        } else {
          var including = read(relativePath, stack);
          including = extractMixin (including, mixinName);
          if (inline) including = trim(including);
          result += inline + including;
        }

        str = str.slice(m.index + m[0].length);
        m = r.exec(str);
      }

      return result + str;
    }

    function read (relativePath, stack) {
      var filePath = options.exactName ?
        path.join(self.base, relativePath) :
        path.join(self.base, path.dirname(relativePath), path.basename(relativePath));

      var newStack = stack.concat([filePath]);

      if (stack.indexOf(filePath) >= 0) throwError(file.path, jsFile, 'INCLUDE', ': circular ' +
        newStack.map(function(i){ return magenta(i); }).join(', '));

      self.includes[filePath] = self.includes[filePath] || time(filePath);

      var s = readIncFile(filePath);
      if (options.recursive) s = exec(s, relativePath, newStack);
      if (options.transform) s = options.transform(s);
      return s;
    }

    function readIncFile (filePath) {
      var s;
      /*
       var isCache = options.cache;
       if (isCache) {
       var cache = self.cacheIncludes[filePath];
       if (cache && time(filePath) === cache.time) return cache.content;
       }
       */
      try {
        s = fs.readFileSync(filePath, {encoding: 'utf8'});
      } catch (e) {
        throwError(file.path, jsFile || '', filePath, ': ' + e.message);
      }

      /*
       if (isCache) self.cacheIncludes[filePath] = {
       time: time(filePath),
       content: s
       };
       */
      return s;
    }

    function isDirty(filePath, cacheModules, cacheIncludes) {
      var cache = cacheModules[filePath];
      if (!cache || cache.time !== time(filePath)) return true;
      if (!cache.includes) return true;
      for (var incFile in cache.includes) {
        if (cacheIncludes[incFile].time !== time(incFile)) return true;
      }
      return false;
    }

    function time(filePath) {
      try {
        var stat = fs.statSync(filePath);
        return stat ? stat.mtime.getTime() : null;
      } catch(e) {
        return null;
      }
    }

    function extractMixin (html, mixinName) {
      if (!mixinName) { return html; }

      var blockRegex = new RegExp('<!--MIXIN ' + mixinName + ' -->([\\s\\S]*?)(?:<!--MIXIN|$)');
      var m = blockRegex.exec(html);
      if (m) {
        return trim(m[1]);
      } else {
        //return '';
        throwError(file.path, jsFile, 'MIXIN', mixinName, ': block not found.');
      }
    }
  });
}

function throwError (/* arguments */) {
  var args = Array.prototype.slice.call(arguments);
  args[0] = cyan(args[0]);
  throw new Error(args.join(' '));
}

module.exports = include;
