/* vim: set et sw=2 ts=2: */
'use strict';

var $ = require('nodash');

module.exports = function getDependencies(getModule, moduleName) {

  var dependencies = {};

  function _getDependencies(moduleName) {
    if (!Object.prototype.hasOwnProperty.call(dependencies, moduleName)) {
      
      var module = getModule(moduleName);
      if (!module) {
        dependencies[moduleName] = null;
      } else {
        dependencies[moduleName] = module.dependencies();
        $.each(_getDependencies, dependencies[moduleName]);
      }
    }
  }

  _getDependencies(moduleName);

  return dependencies;
};

