/* vim: set et sw=2 ts=2: */

describe('Options', function () {
  'use strict';

  var assert = require('assert');
  var Options = require('../Options.js');

  it('does not transform names if unconfigured', function () {
    var options = new Options();
    
    [ "hello-world", "helloWorld", "hello_World" ].forEach(function (name) {
      assert.equal(options.npmNameTransformer(name), name);
    });
  });

  it('uses `npmPrefix`', function () {
    var options = new Options({
      npmPrefix: '$'
    });
    
    assert.equal(options.npmNameTransformer('name'), '$name');
  });
  
  it('uses `npmPostfix`', function () {
    var options = new Options({
      npmPostfix: '$'
    });
    
    assert.equal(options.npmNameTransformer('name'), 'name$');
  });
  
  it('uses `npmPrefix` and `npmPostfix`', function () {
    var options = new Options({
      npmPrefix: '__',
      npmPostfix: '$'
    });
    
    assert.equal(options.npmNameTransformer('name'), '__name$');
  });
  
  it('uses `npmNormalize`', function () {
    var options = new Options({
      npmNormalize: true
    });
    
    assert.equal(options.npmNameTransformer('node-1345'), 'node1345');
    assert.equal(options.npmNameTransformer('hello_world'), 'helloWorld');
    assert.equal(options.npmNameTransformer('asm.js'), 'asmJs');
  });
  
  it('uses an `npmNameTransformer`', function () {
    var options = new Options({
      npmNameTransformer: function (name) {
        return name.toUpperCase();
      }
    });
    
    assert.equal(options.npmNameTransformer('asm.js'), 'ASM.JS');
  });
});