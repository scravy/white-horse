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
    console.log(anotherModule); // 0.44126248732209206
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


## API

### `register(name, module)`

Registers a `module` with the given `name`.

The dependencies of that factory function are its named arguments or the dependencies you
name explicitly using `$dependencies = [ ... ]`.

A module can be anything:

```Javascript
container.register('pi', Math.pi)
container.get('pi', function (err, module) {
  console.log(module); // 3.141592653589793
});
```

If it is a function it is taken to be the factory for a singleton.

Note how `module` does have the same module when retrieving the module twice:

```JavaScript
function f() {
  return 7 + Math.random();
}
container.register('seven', f);
container.get('seven', function (err, module) {
  console.log(module); // 7.9937735903076828
});
container.get('seven', function (err, module) {
  console.log(module); // 7.9937735903076828
});
```

If you want to use the literal function, set `$factory = false` on it.

Note how `module()` is a function invocation in the following example:

```
function g() {
  return Math.random();
}
g.$factory = false;
container.register('func', g);
container.get('func', function (err, module) {
  console.log(module()); // 0.44126248732209206
  console.log(module()); // 0.18552138609811664
});
```

If you do not want it to be a factory for a singleton, set `$singleton = false` on it.

Node how the `module` has a different value each time it is retrieved:

```JavaScript
function h() {
  return Math.random();
}
g.$singleton = false;
container.register('singleton', h);
container.get('singleton', function (err, module) {
  console.log(module); // 0.5290916324593127
});
container.get('singleton', function (err, module) {
  console.log(module); // 0.6509554286021739
});
```

If a function fails to initialize a module, the callback will report that exception:

```JavaScript
function e() {
  throw "damn it";
}
container.register('exceptional', e);
container.get('exceptional', function (err, module) {
  console.log(err); // "damn it" (would be `null` on success)
});
```


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

Example:

```JavaScript
container.use('nodash');
container.inject(function (nodash) {
  // `nodash` is the same as `require('nodash')`
  // but this way it is injected.
});
```


### `useAs(npmModule, alias)`

Uses the given `npmModule` but registers it with the given `alias`.

Example:

```JavaScript
container.use('nodash', 'theDash');
container.inject(function (theDash) {
  // ...
});
```


### `scan(directory, onSuccess, onError)`

Scans the given `directory` and injects the `onSuccess` function. On any error while scanning or injecting `onError` is called. If `onError` is not a valid callback it will emit the `unhandled_error` event.


### `inject(function, callback)`

Injects the given `function` in this containers context.

```JavaScript
container.register('a', 1);
container.regsiter('b', 2);
container.inject(function (a, b) {
  console.log(a + b); // 3
});
```


### `injectWith(function, dependencies, callback)`

Injects the given `function` with the given array of `dependencies`.

```JavaScript
container.register('a', 1);
container.register('b', 2);
function f() {
  console.log(arguments[0]);
  console.log(arguments[1]);
}
container.injectWith(f, [ 'a', 'b' ]); // 1 \n 2 \n
```


## Options


### `usePackageJson` (boolean, default: true)

Whether `dependencies` from your `package.json` should automatically be picked up or not.

With this option, if your `package.json` contains `nodash` as a dependency,
you can inject `nodash` without registering it by the means of `container.use('nodash')`.

It is enabled by default.


### `autoRegister` (array of strings)

An array of modules which should automatically be registered.
By default this is a list of all the modules which are built-in to
node (like `path`, `fs`, etc.). If you do not want any modules to
be registered automatically just set this to `[]` (the empty array).

By default you can inject the modules that ship with node without explicitly registering them, i.e.

```JavaScript
container.inject(function (fs, path) {
  // ...
});
```

will work without the need of explicitly doing `container.use('fs')`
or `container.use('path')` first.


### `npmPrefix` (string)

### `npmPostfix` (string)

### `npmNormalize` (boolean)

### `npmNameTransformer` (function: string -> string)


## Magic Modules

### `$root`

The path to your project root, determined from the `require` method which you
passed into the `WhiteHorse` constructor.


### `$module`

The name of the module this instance is going to be injected into.

A factory which has `$module` as one of its dependencies is automatically
regarded as `$singleton = false`, i.e. it will be invoked everytime the module
it is registered as is injected somewhere.

```JavaScript
container.register('magic', function ($module) {
  return $module;
});
container.register('a', function (magic) {
  console.log(magic); // "a"
});
container.register('b', function (magic) {
  console.log(magic); // "b"
});
```

`$module` is useful when building plugins. As an example:
[white-horse-config](http://github.com/scravy/white-horse-config) is using
this mechanism to inject per-module configuration.


### `$done`

A callback to finish loading of the module. If your module depends on this it is regarded as
an asynchronous module (i.e. you must call `$done` or the module will never finish loading).

Example:

```JavaScript
module.exports = function ($done) {
  $done(null, "finished loading");
};
```

```JavaScript
container.register('f', function ($done) {
  $done(null, "success");
});
container.inject(function (f) {
  console.log(f); // prints "success"
});
```


## Module annotations

### `$singleton` (boolean, default: true)

### `$factory` (boolean, default: true)

### `$dependencies` (array of strings)


## Events

### `initialized`

### `retrieved`

### `unhandled_error`

### `warning`


## Plugin Development

### `$modules`

### `$loaders`


## License (MIT)

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

