# white-horse

[![Build Status](https://travis-ci.org/scravy/white-horse.svg?branch=master)](https://travis-ci.org/scravy/white-horse)
[![Dependencies](https://david-dm.org/scravy/white-horse.svg)](https://david-dm.org/scravy/white-horse#info=dependencies&view=table)
[![Dependencies](https://david-dm.org/scravy/white-horse/dev-status.svg)](https://david-dm.org/scravy/white-horse#info=devDependencies&view=table)


Simple, light-weight dependency injection for NodeJS that supports modules which load asynchronously.


## Usage

    npm install white-horse

```JavaScript
var WhiteHorse = require('white-horse');

var container = new WhiteHorse(require, {
  /* options (optional) */
});
```


## Examples
   
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


## Getting Started


## Options

### `usePackageJson` (boolean, default: true)

Whether `dependencies` from your `package.json` should automatically be picked up or not.

### `autoRegister` (array of strings)

An array of modules which should automatically be registered.
By default this is a list of all the modules which are built-in to
node (like `path`, `fs`, etc.). If you do not want any modules to
be registered automatically just set this to `[]` (the empty array).

### `npmPrefix` (string)

### `npmPostfix` (string)

### `npmNormalize` (boolean)

### `npmNameTransformer` (function: string -> string)


## API

### `register(name, module)`

Registers a `module` with the given `name`.

### `get(name, callback)`

Retrieves an instance of the module named `name`.

Example:

```JavaScript
container.get('module', function (err, instance) {
  if (err) {
    // report `err`
  } else {
    // do something with `instance`
  }
});
```

### `use(npmModule)`

Uses the given `npmModule`.

### `useAs(npmModule, alias)`

Uses the given `npmModule` but registers it with the given `alias`.

### `scan(directory, onSuccess, onError)`

Scans the given `directory` and injects the `onSuccess` function. On any error while scanning or injecting `onError` is called. If `onError` is not a valid callback it will emit the `unhandled_error` event.

### `inject(function, callback)`

### `injectWith(function, dependencies, callback)`


### Magic Modules

## `$root`

The path to your project root, determined from the `require` method which you
passed into the `WhiteHorse` constructor.

## `$module`

The name of the module this instance is going to be injected into.

## `$done`


### Module annotations

## `$singleton` (boolean, default: true)

## `$factory` (boolean, default: true)

## `$dependencies` (array of strings)


## Events

### `initialized`

### `retrieved`

### `unhandled_error`

### `warning`


## Plugin Development

### `$modules`

### `$loaders`


## License

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

