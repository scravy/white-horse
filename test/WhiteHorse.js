/* vim: set et sw=2 ts=2: */

describe('WhiteHorse', function () {
  'use strict';

  var assert = require('assert');
  var WhiteHorse = require('../index.js');

  it('should be initialized without errors', function () {
    var container = new WhiteHorse("someroot");
    assert(container instanceof WhiteHorse);
  });

  it('should be initialized if used without new as if with new', function () {
    var whiteHorse = WhiteHorse;
    var container = whiteHorse("someroot");
    assert(container instanceof WhiteHorse);
  });

  it('getModule() should return undefined if a module does not exist', function () {
    var container = new WhiteHorse("someroot");
    assert.equal(container.getModule("something"), undefined);
  });

  it('getModule() should return a registered module', function () {
    var container = new WhiteHorse("someroot");
    container.register('something', function () {});
    assert(container.getModule("something") instanceof WhiteHorse.Module);
  });

  it('inject() should inject $root', function (done) {
    var container = new WhiteHorse("someroot");
    container.inject(function ($root) {
      assert.equal($root, "someroot");
      return 1337;
    }, function (err, result) {
      assert.equal(err, null);
      assert.equal(result, 1337);
      done();
    });
  });
  
  it('inject() should inject $root + $done (async)', function (done) {
    var container = new WhiteHorse("someroot");
    container.inject(function ($root, $done) {
      assert.equal($root, "someroot");
      $done(null, 1337);
    }, function (err, result) {
      assert.equal(err, null);
      assert.equal(result, 1337);
      done();
    });
  });
  

});
