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
    modules[name] = new Module(factory, name);
    return self;
  };
  
  this.inject = function inject(func, callback) {
    new Module(func).getInstance(self, callback);
  };
 
  this.injectWith = function injectWith(func, dependencies, callback) {

    var name = arguments[3]; // internal parameter

    var args = {};
    var fulfilled = 0;
    var errors = {};
    var isAsync = false;

    function done(dep, err, instance) {
      fulfilled += 1;
      if (err) {
        errors[dep] = err;
      } else if (dep) {
        args[dep] = instance;
      }
      if (fulfilled === dependencies.length + 1) {
        if ($.length(errors) > 0) {
          setImmediate(callback.bind(null, { dependenciesFailed: errors, module: name }));
        } else {
          var argsArray = $.map(function (dep) {
            return args[dep];
          }, dependencies);
          try {
            var result = func.apply(self, argsArray);
            if (!isAsync) {
              setImmediate(callback.bind(null, null, result));
            }
          } catch (err) {
            setImmediate(callback.bind(null, { initializationFailed: err, module: name }));
          }
        }
      }
    }

    $.each(function (dep) {
      switch (dep) {
        case "$done":
          isAsync = true;
          done(dep, null, function (err, result) {
            if (err) {
              setImmediate(callback.bind(null, { initializationFailed: err, module: name }));
            } else {
              setImmediate(callback.bind(null, null, result));
            }
          });
          break;
        case "$module":
          done(dep, null, self.getModule(name));
          break;
        case "$root":
          done(dep, null, root);
          break;
        default:
          self.get(dep, done.bind(null, dep));
      }
    }, dependencies);

    done(null, null, null);
  };

  this.get = function get(name, callback) {
    var module = self.getModule(name);
    if (!module) {
      setImmediate(callback.bind(null, { notFound: name }));
      return;
    }
  
    if (module.isInitialized()) {
      module.getInstance(self, callback);
      return;
    }

    var allDependencies = lib.getDependencies(self.getModule, name);
    var missingDependencies = $.keys($.filter($.isNull, allDependencies));
    if (missingDependencies.length > 0) {
      setImmediate(callback.bind(null, { module: name, missingDependencies: missingDependencies }));
      return;
    }

    var cyclicDependencies = lib.checkDependencies(allDependencies);
    if (cyclicDependencies.length > 0) {
      setImmediate(callback.bind(null, { module: name, cyclicDependencies: cyclicDependencies }));
      return;
    }
   
    module.getInstance(self, callback);
  };

  this.getModule = function getModule(name) {
    if ($.isString(name) && Object.prototype.hasOwnProperty.call(modules, name)) {
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
