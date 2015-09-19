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

**init()**

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

**scan()**

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

**run()**

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


