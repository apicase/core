## Apicase-core beta
The last API library you need.

## What is apicase-core?
Apicase-core provides unified wrapper for any API methods. It just use adapters to convert apicase calls to %method_name% calls.

You probably don't need to know how to use any API library. Just get your adapter and use it!

## Available adapters
Apicase have built-in adapters for `fetch` and `XMLHttpRequest` (named `xhr`) methods.
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

## Hooks
To handle results of apicase calls I made 3 types of hooks.
Hooks are using similar idea with [koa-compose](https://github.com/koajs/compose).
You can pass arrays of hooks and stack it with Apicase.of method.

## Built-in adapters

### Fetch

### XHR