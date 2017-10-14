## Apicase-core beta
The last API library you need.

## What is apicase-core?
Apicase-core provides unified wrapper for any APIs.

It just use adapters to convert apicase calls to `%API_name%` calls.

You probably don't need to know how to use any API library. Just get your adapter and use it!

## Available adapters
Apicase has built-in adapters for `fetch` and `XMLHttpRequest` (named `xhr`) methods.
So the next task will be to add adapters for libraries and methods like:
- [ ] Axios
- [ ] Socket.io (?)
- [ ] Logux (?)
- [ ] GraphQL

New adapters will be available in additional packages named `apicase-adapter-name`

And because of my love to Vue.js I will add shortcuts for Vue.

## Installation
```npm install apicase-core```

## Apicase methods

### Apicase.call(query) - make API call with options
```javascript
Apicase
  .call({
    adapter: 'fetch',
    url: '/posts/:id/comments',
    params: { id: 1 },
    query: { pageId: 1 },
    hooks: {
      success (result, next) {
        console.log(result)
      },
      error (reason, next) {
        console.error(reason)
      }
    }
  })
  .then(console.log)
  .catch(console.log)
```

### Apicase.all(queries) - like Promise.all but takes options array
```javascript
Apicase
  .all([
    { url: '/posts/:id', params: { id: 1 } },
    { url: '/posts/:id', params: { id: 2 } },
    { url: '/posts/:id', params: { id: 3 } }
  ])
  .then(console.log)
  .catch(console.log)
```

### Apicase.of(base) - create service with base options
```javascript
const getPost = Apicase.of({ url: '/posts/:id' })

Apicase
  .call({ params: { id: 1 } })
  .then(console.log)
  .catch(console.log)

Apicase
  .all([
    { params: { id: 1 } },
    { params: { id: 2 } },
    { params: { id: 3 } }
  ])
  .then(console.log)
  .catch(console.log)
```
For better experience with services I'll make apicase-services (soon)

### Apicase.install(plugin) - use it for plugins
```javascript
Apicase.use((instance) => {
  instance.test = 2
})

console.log(Apicase.test) // 2
```

### Apicase.extend(plugin) - like install but doesn't mutate general object
```javascript
const A = Apicase.extend((instance) => {
  instance.test = 2
})

console.log(A.test)        // 2
console.log(Apicase.test)  // undefined
```

### Apicase.on(event, handler) - apicase events handler
```javascript
Apicase.on('success', ({ data }) => {
  console.log('Success', data)
})

Apicase.call({ url: '/api/posts/1' })
// logs: 'Success' + response data
```

#### Available events
- `before ({ options })` - on Apicase.call. Will called **before** `before hooks`
- `call ({ options })` - before service call. Will called **before** `adapter call`
- `success ({ data, options })` - on done called. Will called **before** `success hooks`
- `error ({ reason, options })` - on fail called. Will called **before** `error hooks`
- `finish ({ reason, options })` - on call finished. Will called **after all** `hooks`
- `preinstall (instance)` - on installation or extending. Will called **before** `installer call`
- `postinstall (instance)` - on installation or extending. Will called **after** `installer call`

#### Custom events
Also there is a custom event that emits **before** `another()` call from adapter

Event will has name of `custom hook` and `{ data, options }`

## Hooks
To handle results of apicase calls I made 3 types of hooks.
Hooks are using [koa-compose](https://github.com/koajs/compose) mechanics.

### Notes
- You can pass arrays of hooks to call them in turn
- Also hooks stack with `Apicase.of` method
- You should call `next()` in every hook to complete query without errors
- You can modify `ctx` by assigning values to it. Note that `ctx = smth` won't work. Also I think

### Example
```javascript
Apicase.call({
  url: '/api/posts',
  hooks: {
    before ({ options }, next) {
      console.log(options)
      next()
    },
    success ({ data }, next) {
      console.log(data)
      next()
    },
    error ({ reason }, next) {
      console.log(reason)
      next()
    },
    finish ({ success, data, reason, options }, next) {
      console.log(success ? data : reason)
      next()
    }
  }
})
```

### Hooks vs events
For better understanding of `Apicase.call` work I made that image
![Call queue](https://2.downloader.disk.yandex.ru/disk/a34d2a17be92d5d0abee494d7dc811a45898e3fed5680dc5fe55732469794018/59e194ec/wR63RHQ0VtUVIYC_ZppuVOHsyEMMY1YBI7_JESMeljdUcE6I8_hbkXmfSI2I42mUF2YuXkqUQzYIGNBGEo6WMQ%3D%3D?uid=0&filename=lifecycle.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&fsize=608945&hid=df9ef607e7e461a6e1da6cb268ef9cae&media_type=image&tknv=v2&etag=4817ddb7c0f915aa2a16ef47eff5a61e)

## Built-in adapters

### Fetch

#### Options
Options are same with fetch but with additional features
- `method` - request method (GET / POST / PUT / DELETE)
- `url` - url expression (e.g. `/posts/:id`)
- `params` - object with url params (see [path-to-regexp](https://github.com/pillarjs/path-to-regexp))
- `query` - object with params to query string (will be added to url)
- `data` - JSON / String / FormData. Note that `data` won't be sent on `GET` method
- `headers` - object with request headers.
  - Also you can pass headers function for dynamic headers.
  - For example, you can use headers function to detect auth token changes.
- `parser` - arrayBuffer / blob / formData / json / text
- `credentials` - omit / same-origin / include
- `cache` - default / no-store / reaload / no-cache / force-cache / only-if-cached

#### Behaviour
- `done` after success fetch and parser call with result in `data`
- `fail` on any error (failed to fetch or failed to parse) with Error in `reason`

### XHR

#### Options
- `method` - request method (GET / POST / PUT / DELETE)
- `url` - url expression (e.g. `/posts/:id`)
- `params` - object with url params (see [path-to-regexp](https://github.com/pillarjs/path-to-regexp))
- `query` - object with params to query string (will be added to url)
- `data` - JSON / String / FormData. Note that `data` won't be sent on `GET` method

#### Behaviour
- `done` after success call with `event.currentTarget` in `data`
  - Success condition: `(status >= 200 && status <= 299) || status === 304`
- `fail` after failed call (or another error) with `event.currentTarget` in `reason`
- `another('progress')` calls in `onprogress` event handler with `event` in `data`
- `another('aborted')` calls in `onabort` event handler with `event` in `data`.
  - Note that it also **rejects** Promise (but `error` hooks won't be called).

## License
MIT © [Anton Kosykh](https://github.com/kelin2025)
