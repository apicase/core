# apicase-core

**1.5 KB** library to organize your APIs in a smart way.

## Introduction

There are so many questions about how to good organize work with API in frontend applications  
Some people just don't care about and use native _fetch_, but it's not so flexible and extensible  
Some people create their own wrappers (some classes or just functions, or json objects, no matter), but it often becomes unusable in another projects because it was made for specific APIs  
In addition, there's another problem - work API is often not separated from application to isolated layer. It means that you can't use your APIs with different projects or with different frameworks  
Here is apicase - unified way to create a separated API layer.

## General features

* Instead of binding to **one** API, it uses _adapters_ to work with **any** API interface. It allows you not to be limited by HTTP-only requests but websockets, graphql or even web workers (if you are crazy enough)
* Using _middlewares_ to handle, change on-fly or cancel at all API calls so you can easily use loggers,
* Sometimes we need something more than just service. So apicase has _services_ with **unlimited inheritance**

## Documentation

In progress...

## Author

[Anton Kosykh](https://github.com/Kelin2025)

## License

MIT
