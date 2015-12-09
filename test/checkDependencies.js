/* vim: set et sw=2 ts=2: */

describe('checkDependencies', function () {
  'use strict';

  var assert = require('assert');
  var checkDependencies = require('../lib/checkDependencies');
  
  it("should work and find no cycles even if dependencies are missing", function () {
    var result = checkDependencies({
      'hello': [ 'a', 'b' ]
    });
    assert.deepEqual(result, []);
  });
  
  it("should identify cycles", function () {
    var result = checkDependencies({
      a: [ 'b' ],
      b: [ 'a' ]
    }, 'a');
    assert.deepEqual(result, [ ['a', 'b', 'a'] ]);
  });
  
});