import xhrAdapter from 'adapters/xhr'
import fetchAdapter from 'adapters/fetch'
import { map, pipe, merge } from 'ramda'

export const Apicase = {
  // Options
  options: {
    defaultAdapter: 'fetch'
  },
  // Built-in adapters for fetch and XMLHttpRequest
  adapters: {
    fetch: fetchAdapter,
    xhr: xhrAdapter
  },
  // Use it to add a new adapter
  use (name, adapter) {
    this.adapters[name] = adapter
  },
  // Make API call
  call ({ adapter = this.options.defaultAdapter, ...options }) {
    return new Promise((resolve, reject) => {
      this.adapters[adapter]({
        options,
        done: resolve,
        fail: reject
      })
    })
  },
  // Like Promise.all but iteratees over calls options
  all (queries) {
    return Promise.all(queries.map(this.call))
  },
  // Make a service with prepared options
  // Options from call() and all() methods will be merged with service options
  of (base) {
    const self = this
    return {
      ...self,
      call: pipe(merge(base), self.call.bind(self)),
      all: pipe(map(merge(base)), self.all)
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Apicase-core is available in browser console via Apicase global variable')
  window.Apicase = Apicase
}
