/* vim: set et sw=2 ts=2: */

describe('WhiteHorse', function () {
  'use strict';

  var assert = require('assert');
  var path = require('path');
  var WhiteHorse = require('../index.js');

  it('should be initialized without errors', function () {
    var container = new WhiteHorse(require);
    assert(container instanceof WhiteHorse);
  });
  
  it('should throw if require was not passed as first argument', function () {
    try {
      new WhiteHorse();
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
  
  it('should try to guess $root if require did not resolve', function (done) {
    var requireMock = function () {};
    requireMock.resolve = function () {
      throw "";
    };
    requireMock.cache = require.cache;
    new WhiteHorse(requireMock).inject(function ($root) {
      assert(typeof $root === 'string');
      assert($root.length > 0);
      done();
    }, function (err) {
      assert.equal(err, null);
    });
  });

  it('should be initialized if used without new as if with new', function () {
    var whiteHorse = WhiteHorse;
    var container = whiteHorse(require);
    assert(container instanceof WhiteHorse);
  });

  it('getModule() should return undefined if a module does not exist', function () {
    var container = new WhiteHorse(require);
    assert.equal(container.getModule('something'), undefined);
  });

  it('getModule() should return a registered module', function () {
    var container = new WhiteHorse(require);
    container.register('something', function () {});
    assert(container.getModule('something') instanceof WhiteHorse.Module);
  });

  it('inject() should inject $module as undefined', function (done) {
    var container = new WhiteHorse(require);
    container.inject(function ($module) {
      assert.equal($module, undefined);
      return 1337;
    }, function (err, result) {
      assert.equal(err, null);
      assert.equal(result, 1337);
      done();
    });
  });

  it('inject() should inject $root', function (done) {
    var mockRequire = function (){};
    mockRequire.resolve = function () {
      return 'some/path';
    };
    var container = new WhiteHorse(mockRequire);
    container.inject(function ($root) {
      assert.equal($root, 'some');
      return 1337;
    }, function (err, result) {
      assert.equal(err, null);
      assert.equal(result, 1337);
      done();
    });
  });

  it('inject() should inject $root + $done (async)', function (done) {
    var mockRequire = function (){};
    mockRequire.resolve = function () {
      return 'some/path';
    };
    var container = new WhiteHorse(mockRequire);
    container.inject(function ($root, $done) {
      assert.equal($root, 'some');
      $done(null, 1337);
    }, function (err, result) {
      assert.equal(err, null);
      assert.equal(result, 1337);
      done();
    });
  });

  it('should inject double-dollar dependencies', function (done) {
    var f = function (path) {
      assert(path);
      done();
    };
    var container = new WhiteHorse(require);
    container.injectWith(f, [ '$$path' ]);
  });
  
  it('should emit unhandled_error when not given a fallback to inject()', function (done) {
    var container = new WhiteHorse(require);
    container.on('unhandled_error', function (err) {
      assert(err.dependenciesFailed);
      done();
    });
    container.inject(function (dependency) {});
  });
  
  it('should emit unhandled_error when not given a fallback to injectWith()', function (done) {
    var container = new WhiteHorse(require);
    container.on('unhandled_error', function (err) {
      assert(err.dependenciesFailed);
      done();
    });
    container.injectWith(function () {}, [ 'dependency' ]);
  });
  
  it('should emit a warning when result is not handled in callback in injectWith()', function (done) {
    var container = new WhiteHorse(require);
    container.on('warning', function (warning) {
      assert.equal(warning.unhandledResult, 1337);
      done();
    });
    container.injectWith(function () { return 1337; }, []);
  });
  
  it('getModule() should return undefined if invoked with anything else but a string', function () {
    assert.equal(new WhiteHorse(require).getModule(7), undefined);
  });

  it('use() should register an npm module', function (done) {
    var container = new WhiteHorse(require).use('nodash');
    container.inject(function (nodash) {
      assert(nodash);
    }, function (err, result) {
      assert.equal(err, null);
      done();
    });
  });

  it('use() should register multiple npm modules', function (done) {
    var container = new WhiteHorse(require).use('path', 'fs');
    container.inject(function (path, fs) {
      assert(path);
      assert(fs);
    }, function (err, result) {
      assert.equal(err, null);
      done();
    });
  });

  it('use() should honor package.json', function (done) {
    var container = new WhiteHorse(require);
    container.use(require(require.resolve('../package.json')));
    container.get('chalk', function (err, chalk) {
      assert.equal(err, null);
      assert(chalk);

      container.get('esprima', function (err, esprima) {
        assert.equal(err, null);
        assert(esprima);
        done();
      });
    });
  });

  it('useAs() should register an npm module', function (done) {
    var container = new WhiteHorse(require).useAs('nodash', '$');
    container.get('nodash', function (err, nodash) {
      assert(err);
      assert(!nodash);

      container.get('$', function (err, nodash) {
        assert.equal(err, null);
        assert(nodash);
      });

      container.inject(function ($) {
        assert($);
      }, function (err, result) {
        assert.equal(err, null);
        done();
      });
    });
  });

  it('useAs() should honor $module', function (done) {
    var container = new WhiteHorse(require)
      .useAs(require.resolve('./fixture/someModule.js'), 'someModule')
      .register('dependsOn', 4711)
      .get('someModule', function (err, mod) {
        assert.equal(mod, 4712);
        done();
      });
  });

  it('useAs should honor $modules', function (done) {
    var container = new WhiteHorse(require)
      .use(require.resolve('./fixture/someModules.js'));

    container.get('hello', function (err, mod) {
      assert.equal(mod, 20);

      container.get('world', function (err, mod) {
        assert.equal(mod, 10);
        done();
      });
    });
  });

  it('should identify cyclic dependencies', function (done) {
    var container = new WhiteHorse(require)
      .register('hello', function (world) {})
      .register('world', function (hello) {})
      .get('hello', function (err, instance) {
        assert.deepEqual(err, {
          module: 'hello',
          cyclicDependencies: [ [ 'hello', 'world', 'hello' ] ]
        });
        done();
      });
  });

  it('should identify missing dependencies', function (done) {
    var container = new WhiteHorse(require)
      .register('hello', function (world) {})
      .register('world', function (missing) {})
      .get('hello', function (err, instance) {
        assert.deepEqual(err, {
          module: 'hello',
          missingDependencies: [ 'missing' ]
        });
        done();
      });
  });

  it('should report failed dependencies (async)', function (done) {
    var container = new WhiteHorse(require)
      .register('hello', function (world) {})
      .register('world', function ($done) { $done('no good'); })
      .get('hello', function (err, instance) {
        assert.deepEqual(err, {
          dependenciesFailed: {
            world: {
              initializationFailed: 'no good'
            }
          }
        });
        done();
      });
  });

  it('should report failed dependencies (exception)', function (done) {
    var container = new WhiteHorse(require)
      .register('hello', function (world) {})
      .register('world', function ($done) { throw 'no good'; })
      .get('hello', function (err, instance) {
        assert.deepEqual(err, {
          dependenciesFailed: {
            world: {
              initializationFailed: 'no good'
            }
          }
        });
        done();
      });
  });

  it('should handle a malformed module', function (done) {
    var module = require.resolve('./fixture/throwingModule.js');
    var container = new WhiteHorse(require).useAs(module, 'someModule');

    container.get('someModule', function (err, mod) {
      assert(err.initializationFailed);
      assert.equal(err.initializationFailed.module, module);
      done();
    });
  });

  it('should scan a directory for modules', function (done) {
    var container = new WhiteHorse(require);

    container.scan('fixture/modules', function (a, b) {
      assert.equal(a, 42);
      assert(b);
      assert(b.get instanceof Function);
      assert.equal(b.get(), 42);
      done();
    });
  });

  it('should ignore cyclic dependencies if not actually used', function (done) {
    var container = new WhiteHorse(require);

    container.scan('fixture/cyclic-modules', function () {
      done();
    }, function (err) {
      assert(false);
    });
  });

  it('should report cyclic dependencies scanned from directory', function (done) {
    var container = new WhiteHorse(require);

    container.scan('fixture/cyclic-modules', function (a) {

    }, function (err) {
      assert.deepEqual(err, {
        dependenciesFailed: {
          a: {
            module: 'a',
            cyclicDependencies: [ [ 'a', 'b', 'a' ] ]
          }
        }
      });
      done();
    });
  });

  it('should report cyclic dependencies when module has a dependency on itself)', function (done) {
    var container = new WhiteHorse(require);

    container.scan('fixture/cyclic-modules', function (c) {

    }, function (err) {
      assert.deepEqual(err, {
        dependenciesFailed: {
          c: {
            module: 'c',
            cyclicDependencies: [ [ 'c', 'c' ] ]
          }
        }
      });
      done();
    });
  });

  it('should load and apply $loaders', function (done) {
    var container = new WhiteHorse(require);
    container.use('./fixture/jsonLoader.js');
    container.scan('fixture/modules', function (cfg) {
      assert.equal(cfg.hello, 'world');
      done();
    }, function (err) {
      assert(false);
    });
  });

  it('should report modules that failed to load', function (done) {
    var container = new WhiteHorse(require);
    container.use(require.resolve('./fixture/jsonLoader.js'));
    container.scan('fixture/broken-modules', function (a, b) {
      assert(false);
    }, function (err) {
      assert(err);
      assert(err.scanningDirectoryFailed);
      assert(err.errors);
      assert(err.errors[0]);
      assert(err.errors[0].loadingFailed);
      assert(err.errors[1]);
      assert(err.errors[1].loadingFailed);
      done();
    });
  });

  it('should inject $module', function (done) {
    var container = new WhiteHorse(require)
      .register('a', function ($module) {
        return $module;
      })
      .register('b', function (a) {
        return a;
      })
      .register('c', function (a) {
        return a;
      })
      .inject(function (b, c) {
        assert.equal(b, 'b');
        assert.equal(c, 'c');
        done();
      });
  });

  it('should inject $module (deep)', function (done) {
    var container = new WhiteHorse(require)
      .register('a', function ($module, d) {
        return d + $module;
      })
      .register('b', function (a) {
        return a;
      })
      .register('c', function (a) {
        return a;
      })
      .register('d', function ($module) {
        return $module;
      })
      .inject(function (b, c) {
        assert.equal(b, 'ab');
        assert.equal(c, 'ac');
        done();
      });
  });

  it('should not regard an injector as a singleton', function () {
    var container = new WhiteHorse(require)
      .register('a', function ($module, d) {
        return d + $module;
      })
      .register('b', function (a) {
        return a;
      })
      .register('c', function (a) {
        return a;
      })
      .register('d', function ($module) {
        return $module;
      });
    assert(!container.getModule('a').isSingleton());
    assert(container.getModule('b').isSingleton());
    assert(container.getModule('c').isSingleton());
    assert(!container.getModule('d').isSingleton());
  });

  it('should report unhandled errors on scan()', function (done) {
    var container = new WhiteHorse(require);
    container.use('./fixture/jsonLoader');
    container.on('unhandled_error', function (err) {
      assert(err, 'There should be an error.');
      assert(err.scanningDirectoryFailed, 'Should mention scanningDirectoryFailed');
      assert(err.errors);
      assert(err.errors[0]);
      assert(err.errors[0].loadingFailed);
      assert(err.errors[1]);
      assert(err.errors[1].loadingFailed);
      done();
    });
    container.scan('fixture/broken-modules', function (a, b) {
      assert(false);
    });
  });

  it('should report unhandled errors on inject()', function (done) {
    var container = new WhiteHorse(require);
    container.on('unhandled_error', function (err) {
      assert(err);
      assert(err.dependenciesFailed);
      assert(err.dependenciesFailed.missingDependency);
      assert.equal(err.dependenciesFailed.missingDependency.notFound, 'missingDependency');
      done();
    });
    container.inject(function (missingDependency) {

    });
    container.use({});
  });

  it('should register options.autoRegister modules', function (done) {
    var container = new WhiteHorse(require);
    container.inject(function (path, os, process, timers, console) {
      assert(path);
      assert(os);
      assert(process);
      assert(timers);
      assert(timers.setTimeout instanceof Function);
      assert(timers.setInterval instanceof Function);
      assert(console);
      assert(console.log instanceof Function);
      done();
    });
  });


  it('should process options.autoRegister', function (done) {
    var container = new WhiteHorse(require, {
      autoRegister: [ 'path' ]
    });
    container.inject(function (path) {
      assert(path);
    }, function (err) {
      assert(!err);
      container.inject(function (os) {
        assert(false);
      }, function (err) {
        assert.deepEqual(err, { dependenciesFailed: { os: { notFound: 'os' } } });
        done();
      });
    });
  });
});
