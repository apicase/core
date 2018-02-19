# apicase-core

**2 KB** library to organize your APIs in a smart way.

## Introduction

There are so many questions about how to good organize work with API in frontend applications  
Some people just don't care about and use native _fetch_, but it's not so flexible and extensible  
Some people create their own wrappers (some classes or just functions, or json objects, no matter), but it often becomes unusable in another projects because it was made for specific APIs  
In addition, there's another problem - work API is often not separated from application to isolated layer. It means that you can't use your APIs with different projects or with different frameworks  
Here is apicase - unified way to create a separated API layer.

## General features

* **events-based** requests handling
* **middlewares** to update/change-on-fly/undo/redo API calls
* **adapters** instead of concrete tools (fetch/xhr)
* **services** with unlimited inheritance

## TODO

* [ ] Complete `adapter-fetch` and `adapter-xhr`
* [ ] Complete `apiQueue` and `apiAll` helpers
* [ ] Rewrite tests for actual version
* [ ] Rewrite `apicase-services`
* [ ] Create `apicase-devtools`

## Author

[Anton Kosykh](https://github.com/Kelin2025)

## License

MIT
