# v2.0.0

`white-horse` was completely rewritten with a more stream-lined approach and extensibility in mind.


## Highlights

* `injectors` removed in favor of modules and the more generic `$module` service
* Requiring is more robust now. When constructing new `WhiteHorse` instances the `require` function must be passed in which is used for resolving modules and `$root`
* No more `init()`. Modules are initialized lazily.
* Everything is async now. Since extensions are just ordinary modules this also applies to injectors.
* Other modules than just `*.js` can be loaded by using `$loaders`


## API Changes

### Removals

* `init()` removed
* `get()` is async now and requires a callback
* `registerInjector()` removed

### Additions

* `usePackageJson` option
* `autoRegister` option
* `$singleton` annotation
* `$factory` annotation
* double-dollar dependencies for plugin development
* `use()` looks inside modules to resolve `$modules` and `$loaders`
* Proper `Module` class that can be used to query module configuration + `getModule()`

# v2.0.1

Only improvements to documentation.
