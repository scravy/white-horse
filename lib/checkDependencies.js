/* vim: set et sw=2 ts=2: */
'use strict';

var $ = require('nodash');

var getDependencies = require('./getDependencies');

module.exports = function checkDependencies(getModule, moduleName) {

  var dependencies = getDependencies(getModule, moduleName);

  var cycles = [];

  function check(path, module) {
    path = $.append(path, [ module ]);

    if (dependencies[module]) {
      $.each(function (dep) {
        if ($.elem(dep, path)) {
          cycles.push($.append(path, [ dep ]));
        } else {
          check(path, dep);
        }
      }, dependencies[module]);
    }
  }

  check([], moduleName);

  return cycles;
};
