/* vim: set et sw=2 ts=2: */
'use strict';

var $ = require('nodash');


function Options(options) {
	
  options = options || {};
	
  
  /** options.npmNameTransformer **/
  
  var npmNameTransformer = $.id;

  if ($.isString(options.npmPrefix)) {
    npmNameTransformer = function (name) {
      return options.npmPrefix + name;
    };
  }

  if ($.isString(options.npmPostfix)) {
    npmNameTransformer = $.compose(npmNameTransformer, function (name) {
      return name + options.npmPostfix;
    });
  }

  if (options.npmNormalize === true) {
    npmNameTransformer = $.compose(npmNameTransformer, function (name) {
      var parts = name.split(/[^a-zA-Z0-9]+/);
      for (var i = 1; i < parts.length; i += 1) {
        parts[i] = parts[i][0].toUpperCase() + parts[i].slice(1);
      }
      return parts.join('');
    });
  }

  if ($.isFunction(options.npmNameTransformer)) {
    npmNameTransformer = $.compose(npmNameTransformer, options.npmNameTransformer);
  }
	
  this.npmNameTransformer = npmNameTransformer;
  
  
  /** options.autoRegister **/
  
  var autoRegister = [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'crypto',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'timers',
    'tls',
    'dgram',
    'url',
    'util',
    'v8',
    'vm',
    'zlib'
  ];
  
  if ($.isArray(options.autoRegister) && $.all($.isString, options.autoRegister)) {
    autoRegister = $.clone(options.autoRegister);
  }
  
  this.autoRegister = autoRegister;
}

module.exports = Options;