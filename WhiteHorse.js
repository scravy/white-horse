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
  var loaders = {
    '.js': function (filename, callback) {
      try {
        var module = require(filename);
        setImmediate(callback.bind(null, null, module));
      } catch (err) {
        setImmediate(callback.bind(null, err));
      }
    }
  };

  $.each(function (special) {
    modules[special] = new Module();
  }, [ '$root', '$module', '$done' ]);
  
  var self = this;

  this.register = function register(name, factory) {
    modules[name] = new Module(factory, name);
    return self;
  };
  
  this.inject = function inject(func, callback) {
    new Module(func).getInstance(self, callback);
  };
 
  this.injectWith = function injectWith(func, dependencies, callback) {

    var name  = arguments[3]; // internal parameter

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
          setImmediate(callback.bind(null,
              { dependenciesFailed: errors }));
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
            setImmediate(callback.bind(null, { initializationFailed: err, }));
          }
        }
      }
    }

    $.each(function (dep) {
      switch (dep) {
        case '$done':
          isAsync = true;
          done(dep, null, function (err, result) {
            if (err) {
              setImmediate(callback.bind(null, { initializationFailed: err }));
            } else {
              setImmediate(callback.bind(null, null, result));
            }
          });
          break;
        case '$module':
          done(dep, null, self.getModule(name));
          break;
        case '$root':
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
      setImmediate(callback.bind(null,
          { module: name, missingDependencies: missingDependencies }));
      return;
    }

    var cyclicDependencies = lib.checkDependencies(allDependencies, name);
    if (cyclicDependencies.length > 0) {
      setImmediate(callback.bind(null,
          { module: name, cyclicDependencies: cyclicDependencies }));
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
        $.each(function (a) {
          self.use(a);
        }, arg);
      } else if ($.isString(arg)) {
        //var alias = npmNameTransformer(arg);
        var alias = arg;
        self.useAs(arg, alias);
      } else if ($.isObject(arg) && $.isObject(arg.dependencies)) {
        self.use($.keys(arg.dependencies));
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
      if ($.isObject(module) && $.eq($.keys(module), [ '$module' ])) {
        factory = module.$module;
      } else if ($.isObject(module) &&
          $.eq($.keys(module), [ '$modules' ]) &&
          $.isObject(module.$modules)) {
        $.each($.flip(self.register), module.$modules);
        return self;
      } else if ($.isObject(module) &&
          $.eq($.keys(module), [ '$loaders' ]) &&
          $.isObject(module.$loaders)) {
        $.each(function (loader, extension) {
          loaders[extension] = loader;
        }, module.$loaders);
      } else {
        factory = $.idf(module);
      }
    } catch (err) {
      factory = function ($done) {
        $done({ module: name, error: err });
      };
    }
    self.register(alias, factory);
    return self;
  };
  
  this.scan = function scan(directory, callback, onError) {
    var modulesDir = root ? path.join(root, directory) : directory;
    var walker = new DirectoryWalker();
    var errors = [];
    
    if (!$.isFunction(onError)) {
      onError = function (error) {
        throw error;
      };
    }
    
    function mkError(filename, error) {
      errors.push({ loadingFailed: filename, error: error });
    }
    
    walker.on('error', mkError);
    
    walker.on('file', function (filename) {
      var extension  = path.extname(filename);
      if (!loaders[extension]) {
        return;
      }
      var relative   = path.relative(modulesDir, filename);
      var modulePath = path.join(path.dirname(relative), path.basename(relative, extension));
      var moduleName = modulePath.split(path.sep).join('/');
      try {      
        loaders[extension](filename, function (err, module) {
          if (err) {
            mkError(filename, err);
          } else {
            self.register(moduleName, module);
          }
        });
      } catch (err) {
        mkError(filename, err);
      }
    });
    
    walker.on('end', function () {
      setImmediate(function () {
        if (errors.length > 0) {
          setImmediate(onError.bind(null, { scanningDirectoryFailed: directory, errors: errors }));
        } else {  
          self.inject(callback, function (err) {
            if (err) {
              setImmediate(onError.bind(null, err));
            }
          });
        }
      });
    });
    
    walker.walk(modulesDir);
  };
}


util.inherits(WhiteHorse, EventEmitter);

module.exports = WhiteHorse;
