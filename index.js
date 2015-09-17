/* vim: set et sw=2 ts=2: */
/* jshint node: true */
'use strict';

var lib = require('./lib');
var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var DirectoryWalker = lib.DirectoryWalker;
var toposort = require('toposort');

var doneModuleName = '$done';

function WhiteHorse() {
  
  EventEmitter.call(this);
  var self = this;

  var nothing = {};
  var modules = {};


  function order() {
    var edges = [];

    Object.keys(modules).forEach(function (moduleName) {
      var module = modules[moduleName];
      edges.push([ '', moduleName ]);
      module.dependencies.forEach(function (dependency) {
        if (dependency !== doneModuleName) {
          edges.push([ dependency, moduleName ]);
        }
      });

    });

    var result = toposort(edges);
    result.shift();
    return result;
  }


  this.scan = function (basedir, directory, callback) {

    var modulesDir = path.join(basedir, directory);

    var walker = new DirectoryWalker({
      fileFilter: function (name, cb) {
        cb(null, path.extname(name) === '.js');
      }
    });
    
    var errors = [];

    walker.on('error', function (file, error) {
      errors.push({ file: file, error: error });
    });

    walker.on('file', function (filename) {
      var relative = path.relative(modulesDir, filename);
      var modulePath = path.join(path.dirname(relative), path.basename(relative, '.js'));
      var moduleName = modulePath.split(path.sep).join('/');

      self.emit('require', filename);      
      var module;
      try {
        module = require(filename);
      } catch (err) {
        errors.push({ module: moduleName, error: 'require_failed', cause: err });
        return;
      }
      var result = self.register(moduleName, module);
      if (result !== 'okay') {
        errors.push({ module: moduleName, error: result });
      }
    });

    walker.on('end', function () {
      callback(errors.length ? errors : null);
    });

    walker.walk(modulesDir);
  };


  this.register = function (name, thing) {

    var dependencies = [];
    if (typeof thing === 'function') {
      dependencies = Array.isArray(thing.$inject) ?
          thing.$inject : lib.getParameters(thing);
    }
    var isAsync = dependencies.some(function (dependency) {
      return dependency === doneModuleName;
    });

    var module = {
      name: name,
      isAsync: isAsync,
      dependencies: dependencies,
      instance: nothing
    };

    if (typeof thing === 'function') {
      module.factory = thing;
    } else {
      module.instance = thing;
    }

    modules[name] = module;

    try {
      order();
      return 'okay';
    } catch (err) {
      delete modules[name];
      return 'cyclic_dependency';
    }
  };


  this.init = function (callback) {
    var initOrder = order();
    var current = 0;

    var errors = [];
    Object.keys(modules).forEach(function (moduleName) {
      var module = modules[moduleName];
      module.dependencies.forEach(function (dependency) {
        if (dependency !== doneModuleName && !modules[dependency]) {
          errors.push({
            module: module.name,
            error: 'unmet_dependency',
            missing: dependency
          });
        }
      });
    });

    if (errors.length > 0) {
      callback(errors);
      return;
    }

    function done(module, instance) {
      module.instance = instance;
      self.emit('after_init', module.name, instance);
      current += 1;
      setImmediate(initialize);
    }

    function initialize() {
      if (current < initOrder.length) {
        
        var moduleName = initOrder[current];
        var module = modules[moduleName];

        self.emit('before_init', moduleName);

        var args = [];

        module.dependencies.forEach(function (dependency) {
          if (dependency === doneModuleName) {
            args.push(function (err, instance) {
              if (err) {
                callback(err);
              } else {
                done(module, instance);
              }
            }); 
          } else {
            args.push(modules[dependency].instance);
          }
        });

        try {
          var instance = module.factory ?
                module.factory.apply(self, args) : module.instance;
          
          if (!module.isAsync) {
            done(module, instance);
          }
        } catch (err) {
          callback(err);
        }
        
      } else {
        callback(null);
      }
    }

    setImmediate(initialize);
  };


  this.run = function (basedir, directory, module, callback) {
    if (!callback) {
      callback = module;
      module = '';
    }
    
    self.scan(basedir, directory, function (err) {
      if (err) {
        callback(err);
        return;
      }
      self.init(function (err) {
        if (err) {
          callback(err);
          return;
        }
        if (module) {
          callback(null, self.get(module));
        } else {
          callback(null);
        }
      });
    });
  };


  this.dependenciesFor = function (moduleName) {
    var module = modules[moduleName];
    if (module) {
      return module.dependencies.splice(0);
    }
  };


  this.isAsync = function (moduleName) {
    var module = modules[moduleName];
    if (module) {
      return module.isAsync;
    }
  };


  this.use = function (npm) {
    if (arguments.length === 1) {
      if (Array.isArray(npm)) {
        npm.forEach(function (val) {
          self.use(val);
        });
      } else if (typeof npm === 'string') {
        self.useAs(npm, npm);
      } else if (typeof npm === 'object') {
        if (typeof npm.dependencies === 'object') {
          self.use(Object.keys(npm.dependencies));
        }
      }
    } else {
      self.use([].splice.call(arguments, 0));
    }
    return self;
  };


  this.useAs = function (name, alias) {
    self.register(alias, function () {
      self.emit('require', name);
      return require(name);
    });
    return self;
  };


  this.get = function (moduleName) {
    var module = modules[moduleName];
    if (module) {
      return module.instance;
    }
  };


  this.modules = function () {
    return Object.keys(modules);
  };
}

util.inherits(WhiteHorse, EventEmitter);

module.exports = WhiteHorse;
