/* vim: set et sw=2 ts=2: */
/* jshint node: true */
'use strict';

var esprima = require('esprima');

/**
 * Get the names of the parameters of a function.
 */
function getParameters(func) {

  var sourceCode = 'var x = ' + Function.prototype.toString.call(func);
  var syntaxTree = esprima.parse(sourceCode.replace('[native code]', ''));
  var parameters = syntaxTree.body[0].declarations[0].init.params;

  var parameterNames = [];

  parameters.forEach(function (parameter) {
      parameterNames.push(parameter.name);
  });

  return parameterNames;
}

module.exports = {
  getParameters: getParameters
};
