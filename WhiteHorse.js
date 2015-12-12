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

function WhiteHorse(root, givenOtions) {

  if (!(this instanceof WhiteHorse)) {
    return new WhiteHorse(root, options);
  }

  var options = new Options(givenOtions || root);
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

  
  var self = this;

  function init() {
    
    $.each(function (special) {
      modules[special] = new Module();
    }, [ '$root', '$module', '$done' ]);
    
    $.each(function (module) {
      self.register(module, function () {
        if (global[module]) {
          return global[module];
        }
        return require(module);
      });
    }, options.autoRegister);
  }

  this.register = function register(name, factory) {
    modules[name] = new Module(factory, name);
    return self;
  };
  
  this.inject = function inject(func, callback) {
    new Module(func).getInstance(self, $.isFunction(callback) ? callback : function (err) {
      if (err) {
        self.emit('unhandled_error', err);
      }
    });
  };
 
  this.injectWith = function injectWith(func, dependencies, callback) {

    var __name = arguments[3];
    var __forModule = arguments[4];

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
          done(dep, null, __forModule);
          break;
        case '$root':
          done(dep, null, root);
          break;
        default:
          self.get(dep, done.bind(null, dep), __name);
      }
    }, dependencies);

    done(null, null, null);
  };

  this.get = function get(name, callback) {
    
    var __forModule = arguments[2];
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
   
    module.getInstance(self, callback, __forModule);
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
        var alias = options.npmNameTransformer(arg);
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
        self.emit('unhandled_error', error);
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
  
  init();
}


util.inherits(WhiteHorse, EventEmitter);

module.exports = WhiteHorse;
