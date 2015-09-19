# white-horse

[![Build Status](https://travis-ci.org/scravy/white-horse.svg?branch=master)](https://travis-ci.org/scravy/white-horse)

Simple, light-weight dependency injection for NodeJS that supports modules which load asynchronously.


# Usage

    npm install --save white-horse

For examples see [the examples directory](examples/).


# API

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


### use(npmPackageName)

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

### useAs(npmPackageName, moduleName)

```JavaScript```
container.useAs('white-horse', WhiteHorse);
```

Registers an npm package as a module with the given name. This is useful
if you wand to use an npm package that contains dashes or dots in its
name.


### init(callback)

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

### modules()

```JavaScript
container.modules()
```

Retrieve a list of modules registered with this container.


**isAsync(moduleName)**

```JavaScript
container.isAsync('mainModule')
```

Check whether a module is an asynchronous module or not.

