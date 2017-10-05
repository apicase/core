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

### Apicase.all(queries) - like Promise.all but takes options array

### Apicase.of(base) - create service with base options

> More info in a few days later
