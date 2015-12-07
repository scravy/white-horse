/* vim: set et sw=2 ts=2: */
'use strict';

var thresholds = {
  statements: 0,
    branches: 0,
   functions: 0,
       lines: 0
};

var chalk = require('chalk'),
   jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
 istanbul = require('gulp-istanbul'),
 enforcer = require('gulp-istanbul-enforcer'),
     gulp = require('gulp');

var npmPackage = require('./package.json');

function errorHandler(err) {
  console.log(chalk.red(err.message));
  process.exit(1);
}

var sources = [ 'index.js', 'Module.js', 'WhiteHorse.js', 'Options.js', 'lib/**/*.js' ];

gulp.task('lint', function (done) {
  gulp.src([ '*.js', 'lib/**/*.js', 'test/**/*.js' ])
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(jshint.reporter('fail'))
      .on('error', errorHandler)
      .on('finish', done);
});

gulp.task('coverage', [ 'lint' ], function (done) {
  gulp.src(sources)
      .pipe(istanbul())
      .pipe(istanbul.hookRequire())
      .on('error', errorHandler)
      .on('finish', function () {
        gulp.src('test/**/*.js')
            .pipe(mocha())
            .pipe(istanbul.writeReports({ dir: 'dist/coverage/' }))
            .on('finish', done);
      });
});

gulp.task('test', [ 'coverage' ], function (done) {
  gulp.src('.')
      .pipe(enforcer({
        thresholds: thresholds,
        coverageDirectory: 'dist/coverage/',
        rootDirectory: ''
      }))
      .on('error', errorHandler)
      .on('finish', done);
});

gulp.task('default', [ 'lint' ]);


