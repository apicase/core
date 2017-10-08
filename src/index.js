// @flow
import * as Types from './types'
import xhrAdapter from './adapters/xhr'
import fetchAdapter from './adapters/fetch'
import { pipeM, mergeHooks, mergeOptions, mapComposeHooks } from './utils'

export const Apicase: Types.Apicase = {

  // Base for calls
  base: {
    query: {},
    hooks: { }
  },

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
    const query = mergeOptions(this.base.query, options)
    const h = mapComposeHooks(mergeHooks(this.base.hooks, hooks))
    await h.before(query)
    return new Promise((resolve, reject) => {
      this.adapters[adapter]({
        options: query,
        done: pipeM(h.success, resolve),
        fail: pipeM(h.error, reject),
        another: (name, data, fail = false) =>
          pipeM(h[name], ...(fail ? [reject] : []))(data)
      })
    })
  },

  // Like Promise.all but iteratees over calls options
  all (queries) {
    return Promise.all(queries.map(q => this.call(q)))
  },

  // Make a service with prepared options
  // Options from call() and all() methods will be merged with service options
  of ({ hooks = {}, ...options }) {
    return {
      ...this,
      base: {
        query: mergeOptions(this.base.hooks, options),
        hooks: mergeHooks(this.base.hooks, hooks)
      }
    }
  }

}

if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Apicase-core is available in browser console via Apicase global variable')
  window.Apicase = Apicase
}
