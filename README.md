# apicase-core

A **2 KB** library to organize your APIs in a smart way.

## Introduction

There are so many questions about how to properly organize and work with APIs in frontend applications.

Some people just don't think about it much; they use native `fetch`, but it's not very flexible or extensible. Some people create their own wrappers (classes, functions, or json objects), but those often become unusable in other projects because they were made for specific APIs.

There's another problem—the API is often not separated from the application into an isolated layer. It means that you can't reuse your APIs with different projects or frameworks.

Here is apicase—a unified way to create that isolated API layer.

## General features

* **events-based** requests handling
* **middlewares** to update/change-on-fly/undo/redo API calls
* **adapters** instead of concrete tools (fetch/xhr)
* **services** with unlimited inheritance

## Documentation

### Full docs

[**Read on gitbook**](https://kelin2025.gitbooks.io/apicase/content/)

### Basic request

Wrap adapter into `apicase` method and use it like it's Axios

```javascript
import { apicase } from '@apicase/core'
import fetch from '@apicase/adapter-fetch'

const doRequest = apicase(fetch)

const { success, result } = await doRequest({
  url: '/api/posts/:id',
  method: 'POST',
  params: { id: 1 },
  body: {
    title: 'Hello',
    text: 'This is Apicase'
  },
  headers: {
    token: localStorage.getItem('token')
  }
})

if (success) {
  console.log('Yay!', result)
} else {
  console.log('Hey...', result)
}
```

### Events-based requests handling

Following _"Business logic failures are not exceptions"_ principle,  
Apicase separates error handling from request fails:

```javascript
doRequest({ url: "/api/posts" })
  .on("done", res => {
    console.log("Done", res)
  })
  .on("fail", res => {
    console.log("Fail", res)
  })
  .on("error", err => {
    console.error(err)
  })
```

### Apicase services

Move your API logic outside the main application code

```javascript
import { ApiService } from "@apicase/core"
import fetch from "@apicase/adapter-fetch"

const ApiRoot = new ApiService({
  adapter: fetch,
  url: "/api"
})
  .on("done", logSucccess)
  .on("fail", logFailure)

const AuthService = ApiRoot.extend({ url: "auth" }).on("done", res => {
  localStorage.setItem("token", res.body.token)
})

AuthService.doRequest({
  body: { login: "Apicase", password: "*****" }
})
```

### Request queues

Keep correct order of requests using queues

```javascript
import { ApiQueue } from "@apicase/core"

const queue = new ApiQueue()

queue.push(SendMessage.doRequest, { body: { message: "that stuff" } })
queue.push(SendMessage.doRequest, { body: { message: "really" } })
queue.push(SendMessage.doRequest, { body: { message: "works" } })
```

## TODO

* [ ] Add plugins support to make work much easier
* [ ] Create `apicase-devtools`

## Author

[Anton Kosykh](https://github.com/Kelin2025)

## License

MIT
