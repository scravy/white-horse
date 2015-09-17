/* vim: set et sw=2 ts=2: */
/* jshint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function DirectoryWalker(options) {

  EventEmitter.call(this);  
  var self = this;

  options = options || {};
  
  var dirFilter = null;
  if (typeof options.dirFilter === 'function') {
    dirFilter = options.dirFilter;
  }

  var fileFilter = null;
  if (typeof options.fileFilter === 'function') {
    fileFilter = options.fileFilter;
  }

  this.walk = function walk(directory) {
    
    var spawned = 0;

    function ready() {
      spawned -= 1;
      if (spawned === 0) {
        self.emit('end');
      }
    }

    function done(directory, err, files) {
      if (err) {
        self.emit('error', directory, err);
      } else {
        files.forEach(function (file) {
          file = path.join(directory, file);
          self.emit('entry', file);

          spawned += 1;
          fs.stat(file, function (err, stats) {
            if (err) {
              self.emit('error', file, err);

            } else {
              self.emit('stats', file, stats);

              if (stats.isDirectory()) {
                if (dirFilter) {
                  spawned += 1;
                  dirFilter(file, function (err, okay) {
                    if (err) {
                      self.emit('error', file, err);
                    } else if (okay) {
                      self.emit('dir', file);
                      spawned += 1;
                      fs.readdir(file, done.bind(null, file));
                    }
                    ready();
                  });
                } else {
                  self.emit('dir', file);
                  spawned += 1;
                  fs.readdir(file, done.bind(null, file));
                }

              } else if (stats.isFile()) {
                if (fileFilter) {
                  spawned += 1;
                  fileFilter(file, function (err, okay) {
                    if (err) {
                      self.emit('error', file, err);
                    } else if (okay) {
                      self.emit('file', file);
                    }
                    ready();
                  });
                } else {
                  self.emit('file', file);
                }
              }
            }
            ready();
          });
        });
      }
      ready();
    }

    spawned += 1;
    fs.readdir(directory, done.bind(null, directory));
  };
}

util.inherits(DirectoryWalker, EventEmitter);

module.exports = DirectoryWalker;
