import xhrAdapter from 'adapters/xhr'
import fetchAdapter from 'adapters/fetch'
import { map, omit, pipe, clone, merge, concat, mergeWith } from 'ramda'
import { pipeM, composeHooks, normalizeHooks } from 'utils'

export const Apicase = {
  // Base for calls
  base: { },
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
  // TODO: Make it a little simpler
  async call ({
    adapter = this.options.defaultAdapter,
    hooks = {},
    ...options
  } = {}) {

    const opts = merge(
      omit('hooks', this.base),
      clone(options),
      { adapter }
    )

    const h = pipe(
      normalizeHooks,
      mergeWith(concat, normalizeHooks(this.base.hooks)),
      map(h => composeHooks(...h))
    )(hooks)

    await h.before(opts)

    return new Promise((resolve, reject) => {
      this.adapters[adapter]({
        options,
        done: pipeM(h.success, resolve),
        fail: pipeM(h.error, reject),
        another: (name, data, fail = false) => pipeM(h[name], ...(fail ? [reject] : []))(data)
      })
    })

  },
  // Like Promise.all but iteratees over calls options
  all (queries) {
    return Promise.all(queries.map(this.call))
  },
  // Make a service with prepared options
  // Options from call() and all() methods will be merged with service options
  // TODO: Improve this method and realize it without hacks
  of (base) {
    const self = clone(this)
    self.base = merge(self.base, base)
    return self
  }
}

Apicase.of({ url: '/root/:id', hooks: { before: () => {} } }).call({
  params: { id: 1 },
  hooks: {
    before: () => {},
    success: (ctx, next) => console.log(ctx) || next(),
    error: (ctx, next) => console.log(ctx) || next()
  }
}).then(console.log).catch(console.log)

if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Apicase-core is available in browser console via Apicase global variable')
  window.Apicase = Apicase
}
