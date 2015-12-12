# white-horse

[![Build Status](https://travis-ci.org/scravy/white-horse.svg?branch=master)](https://travis-ci.org/scravy/white-horse)
[![Dependencies](https://david-dm.org/scravy/white-horse.svg)](https://david-dm.org/scravy/white-horse#info=dependencies&view=table)
[![Dependencies](https://david-dm.org/scravy/white-horse/dev-status.svg)](https://david-dm.org/scravy/white-horse#info=devDependencies&view=table)


Simple, light-weight dependency injection for NodeJS that supports modules which load asynchronously.

Usage
-----

    npm install white-horse
   
```JavaScript
    WhiteHorse(require)
      .register('oneModule', function () {
        return "l";
      })
      .register('anotherModule', function (oneModule, yetAnotherModule) {
        return "He" + oneModule + yetAnotherModule;
      })
      .register('yetAnotherModule', function (oneModule, $done) {
        $done(null, oneModule + "o");
      })
      .inject(function (anotherModule) {
        console.log(anotherModule);
      }, function (err) {
        console.error(err);
      });
```
    
```JavaScript
    WhiteHorse(require)
      .use(require('./package.json'))
      .scan('modules', function (main) {
        main.run();
      }, function (error) {
        console.log("Aww snap:", error);
      });
```

API
---

### `register(name, module)`

### `get(name, callback)`

### `use(npmModule)`

### `useAs(npmModule, alias)`

### `scan(directory, onSuccess, onError)`

### `inject(function, callback)`

### `injectWith(function, dependencies, callback)`

License
-------

    Copyright (c) 2015 Julian Alexander Fleischer

    Permission is hereby granted, free of charge, to any
    person obtaining a copy of this software and associated
    documentation files (the "Software"), to deal in the
    Software without restriction, including without
    limitation the rights to use, copy, modify, merge,
    publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software
    is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice
    shall be included in all copies or substantial portions
    of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
    ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
    TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
    PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
    THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
    CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.

