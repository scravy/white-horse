/* vim: set et sw=2 ts=2: */

describe('Module', function () {
  'use strict';

  var assert = require('assert');
  var Module = require('../Module.js');

  var mockContainer = function (err, instance) {
    return {
      injectWith: function (func, dependencies, callback) {
        setImmediate(callback.bind(null, err || null, instance || null));
      },
      emit: function() {}
    };
  };

  it('initializes a static module', function (done) {
    
    var module = new Module(7);

    module.getInstance(mockContainer(), function (err, instance) {
      assert(!err);
      assert.equal(instance, 7);
      done();
    });
  });

  it('recognizes a static module as already initialized', function () {
    
    var module = new Module(7);

    assert(module.isInitialized());
  });

  it('regards a $factory annotated function as static', function () {

    var module1 = new Module(function () {});
    assert(!module1.isInitialized());

    function func() {}
    func.$factory = false;
    var module2 = new Module(func);
    assert(module2.isInitialized());
  });

  it('does not initialize a singleton twice', function () {

    var module = new Module(function () {});

    module.getInstance(mockContainer(null, 1), function (err, instance) {
      assert(instance, 1);
      module.getInstance(mockContainer(null, 2), function (err2, instance2) {
        assert(instance2, 1);
      });
    });
  });

  it('does initialize a non-singleton again', function () {

    var func = function () {};
    func.$singleton = false;
    var module = new Module(func);

    module.getInstance(mockContainer(null, 1), function (err, instance) {
      assert(instance, 1);
      module.getInstance(mockContainer(null, 2), function (err2, instance2) {
        assert(instance2, 2);
      });
    });
  });

  it('reports an errorneously instantiated module', function (done) {
    
    var module = new Module(function () {});
    
    module.getInstance(mockContainer('error'), function (err, instance) {
      assert(!!err);
      assert(module.hasError());
      done();
    });
  });

  it('isInitialized() is true even for a module that hasError()', function (done) {
    
    var module = new Module(function () {});
    
    module.getInstance(mockContainer('error'), function (err, instance) {
      assert(module.isInitialized());
      done();
    });
  });

  it('extracts the dependencies from function arguments', function () {

    var module = new Module(function (a, b) {});

    assert.deepEqual(module.dependencies(), [ 'a', 'b' ]);
  });

  it('extracts the dependencies from $dependencies annotation', function () {
    
    var func = function (a, b) {};
    func.$dependencies = [ "hello", "world" ];
    var module = new Module(func);

    assert.deepEqual(module.dependencies(), [ 'hello', 'world' ]);
  });

  it('identifies an async module', function () {

    var module = new Module(function (a, $done) {});

    assert(module.isAsync());
  });


});
