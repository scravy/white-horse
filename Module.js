/* vim: set et sw=2 ts=2: */
'use strict';

var lib = require('./lib');
var $ = require('nodash');

module.exports = function Module(factory, name) {

  var _name = name;

  var _isInitialized = false;

  var _isSingleton = true;

  var _instance = null;

  var _error = null;

  var _factory = factory;

  var _dependencies = [];
  
  if (!$.isFunction(factory) || factory.$factory === false) {
    _factory = $.idf(factory);
    _instance = factory;
    _isInitialized = true;
  } else {
    if ($.isArray(_factory.$dependencies) && $.all($.isString, _factory.$dependencies)) {
      _dependencies = $.map($.id, _factory.$dependencies);
    } else {
      _dependencies = lib.getFunctionParameterNames(_factory);
    }
    _isSingleton = factory.$singleton !== false;
  }
  
  if ($.any($.eq('$module'), _dependencies)) {
    _isSingleton = false;
  }

  var _isAsync = $.any($.eq('$done'), _dependencies);

  
  var self = this;

  this.getInstance = function getInstance(container, callback) {
    var __forModule = arguments[2];
    if (_isInitialized) {
      setImmediate(function () {
        container.emit('retrieved', name, _error, _instance);
        callback(_error, _instance);
      });
    } else {
      setImmediate(function () {
        container.emit('initializing', name, _isInitialized);
        container.injectWith(_factory, _dependencies, function (err, instance) {
          container.emit('initialized', name, err, instance, _isInitialized);
          _isInitialized = _isSingleton;
          if (err) {
            _error = err;
            callback(err);
          } else {
            if (_isSingleton) {
              _instance = instance;
            }
            callback(null, instance);
          }
        }, _name, __forModule);
      });
    }
  };

  this.dependencies = $.idf(_dependencies);
  this.hasError = function () { return !!_error; };
  this.isAsync = $.idf(_isAsync);
  this.isInitialized = function () { return _isInitialized; };
  this.isSingleton = $.idf(_isSingleton);
  this.name = $.idf(_name);
};
