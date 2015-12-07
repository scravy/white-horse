/* vim: set et sw=2 ts=2: */
'use strict';

var $               = require('nodash');
var util            = require('util');
var path            = require('path');
var DirectoryWalker = require('directorywalker');
var EventEmitter    = require('events').EventEmitter;

var lib     = require('./lib');
var Module  = require('./Module');
var Options = require('./Options');

function WhiteHorse(root, options) {

  if (!(this instanceof WhiteHorse)) {
    return new WhiteHorse(root, options);
  }

  options = options || {};

  var modules = {};

  
  var self = this;

  this.register = function register(name, factory) {
    modules[name] = new Module(factory);
    return self;
  };
  
  this.inject = function inject(func, callback) {
    new Module(func).getInstance(self, callback);
  };
 
  this.injectWith = function injectWith(func, dependencies, callback) {
    if (!$.isFunction(func)) {
      throw new TypeError("`func' must be a function.");
    }

    var args = [];

    try {
      var result = func.apply(self, args);
      setImmediate(callback.bind(null, null, result));
    } catch (err) {
      setImmediate(callback.bind(null, err));
    }
  };

  this.get = function get(name, callback) {
    var module = self.getModule(name);
    
    if (!module) {
      setImmediate(callback.bind(null, "no module named `" + name + "' registered."));
    } else {
      module.getInstance(self, callback);
    }
  };

  this.getModule = function getModule(name) {
    if (Object.prototype.hasOwnProperty.call(modules, name)) {
      return modules[name];
    } else {
      return undefined;
    }
  };
     
  this.use = function use(arg) {
    if (arguments.length === 1) {
      if ($.isArray(arg)) {
        $.each(self.use, arg);
      } else if ($.isString(arg)) {
        //var alias = npmNameTransformer(arg);
        var alias = arg;
        self.useAs(arg, alias);
      } else if ($.isObject(arg)) {
        if ($.isObject(arg.dependencies)) {
          self.use($.keys(arg.dependencies));
        }
      }
    } else {
      self.use([].splice.call(arguments, 0));
    }
    return self;
  };

  this.useAs = function useAs(name, alias) {
    var factory;
    try {
      var module = require(name);
      if ($.isObject(module) && $.eq($.keys(module), [ "$module" ])) {
        factory = module.$module;
      } else if ($.isObject(module) &&
          $.eq($.keys(module), [ "$modules" ]) &&
          $.isObject(module.$modules)) {
        $.each($.flip(self.register), module.$modules);
        return self;
      } else {
        factory = $.idf(module);
      }
    } catch (err) {
      factory = function () {
        throw err;
      };
    }
    self.register(alias, factory);
    return self;
  };
}


util.inherits(WhiteHorse, EventEmitter);

module.exports = WhiteHorse;
