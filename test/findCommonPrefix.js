/* vim: set et sw=2 ts=2: */

describe('findCommonPrefix', function () {
  'use strict';

  var assert = require('assert');
  var findCommonPrefix = require('../lib/findCommonPrefix');
  var $ = require('nodash');
  
  it("should find a prefix between yammi and yummi", function () {
    assert.equal(findCommonPrefix('yammi', 'yummi'), 'y');
  });
  
  it("should find the empty prefix between hello and world", function () {
    assert.equal(findCommonPrefix('hello', 'world'), '');
  });
  
  it("should find a prefix between ohmy and ohmysweetjesus", function () {
    assert.equal(findCommonPrefix('ohmy', 'ohmysweetjesus'), 'ohmy');
  });
  
  it("should find a prefix between holycow and holyshit", function () {
    assert.equal(findCommonPrefix('holycow', 'holyshit'), 'holy');
  });
  
  it("work beautifully if used in a fold on lists", function () {
    assert.equal($.foldl1(findCommonPrefix, [
      '/usr/share',
      '/usr/lib',
      '/usr/etc',
      '/usr/etc/X11'
    ]), '/usr/');
  });
});