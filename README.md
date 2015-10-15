white-horse
===========

[![Build Status](https://travis-ci.org/scravy/white-horse.svg?branch=master)](https://travis-ci.org/scravy/white-horse)
[![Dependencies](https://david-dm.org/scravy/white-horse.svg)](https://david-dm.org/scravy/white-horse#info=dependencies&view=table)
[![Dependencies](https://david-dm.org/scravy/white-horse/dev-status.svg)](https://david-dm.org/scravy/white-horse#info=devDependencies&view=table)


Simple, light-weight dependency injection for NodeJS that supports modules which load asynchronously.


Usage
-----

    npm install --save white-horse

For examples see [the examples directory](examples/).


API
---

```JavaScript
var container = new WhiteHorse();
```

Creates a new [IoC](https://en.wikipedia.org/wiki/Inversion_of_control)
container.


### register(moduleName, moduleFactory)

```JavaScript
container.register('mainModule', function (file, path, fs, http) {
  return {
    doYourJob: function () {
      console.log('Hello World!');
    }
  };
});
```

Registers a module with the container.


use(npmPackageName)
-------------------

```JavaScript
container.use('http');
```

Registers an npm package as a module. You can use this function to load
all the dependencies from your `package.json` as modules:

```JavaScript
container.use(require('./package.json'));
```

You can register multiple modules at once by either passing an array
or multiple arguments:

```JavaScript
container.use('file', 'path', 'fs', 'http')
container.use(['file', 'path', 'fs', 'http'])
```

useAs(npmPackageName, moduleName)
---------------------------------

```JavaScript```
container.useAs('white-horse', WhiteHorse);
```

Registers an npm package as a module with the given name. This is useful
if you wand to use an npm package that contains dashes or dots in its
name.


init(callback)
--------------

```JavaScript
container.init(function (err) {
  if (err) {
    console.log('Initialization of the container failed', err);
    return;
  }
  // do something
}
```

Initializes the container, i.e. initializes all registered modules.
The modules are initialized one after the other, in an order that
satisfied their dependencies.


### scan(root, modulesDir, callback)

```JavaScript
container.scan(rootDir, modulesDir, function (err) {
  if (err) {
    console.log('Failed traversing through', modulesDir);
    return;
  }
  // at this point modules are gathered from the modules directory
  // but the container is not yet initialized.
});
```

Scans the `modulesDir` inside the `rootDir`. The separate arguments are
for convenience, i.e. you may want to invoke this function like this:

```JavaScript
container.scan(__dirname, 'modules', function (err) { ... });
```

### run(...)

A convenience method that combines `scan` and `init`, i.e.:

```JavaScript
container.run(__dirname, 'modules', function (err) {
  if (err) {
    console.log(err);
    return;
  }
  container.get('mainModule').doYourJob();
});
```

is equivalent to:

```JavaScript
container.scan(__dirname, 'modules', function (err) {
  if (err) {
    console.log(err);
    return;
  }
  container.init(function (err) {
    if (err) {
      console.log(err);
      return;
    }
    container.get('mainModule').doYourJob();
  }
}
```

If you're having a kind of main module as above, the example
can be condensed even further:

```JavaScript
container.run(__dirname, 'modules', 'mainModule', function (err, mainModule) {
  if (err) {
    console.log(err);
  } else {
    mainModule.doYourJob();
  }
});
```


### inject(func, callback)

```JavaScript
container.inject(function (mainModule) { ... }, function (err, result) { ... })
```

Injects a function (i.e. invokes the function with the dependencies
loaded form the container).

The callback is optional. The result of calling the function will be
returned right away if you do not specify a callback or if the
function is an asynchronous function (has a dependency on `$done`).
This way you can e.g. return a promise from your asynchronous functions.


### injectWith(dependencies, func, callback)

```JavaScript
container.injectWith(['uuid-1345'], function (UUID) { ... }, function (err, result) { ... })
```

Injects a function with the dependencies named in the first argument.

The callback is optional. The result of calling the function will be
returned right away if you do not specify a callback or if the
function is an asynchronous function (has a dependency on `$done`).
This way you can e.g. return a promise from your asynchronous functions.


### modules([returnOrdered])

```JavaScript
container.modules()
```

Retrieve a list of names of modules registered with this container.

If the optional `returnOrdered` parameter is true the module names
will be named in the order they are initialized.


### isAsync(moduleName)

```JavaScript
container.isAsync('mainModule')
```

Check whether a module is an asynchronous module or not.


### isInitialized(moduleName)

```JavaScript
container.isInitialized('mainModule')
```

Check whether a module has already been initialized.
