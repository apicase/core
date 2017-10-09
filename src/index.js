// @flow
import { clone } from 'ramda'
import * as Types from './types'
import NanoEvents from 'nanoevents'
import xhrAdapter from './adapters/xhr'
import fetchAdapter from './adapters/fetch'
import { pipeM, mergeHooks, mergeOptions, mapComposeHooks } from './utils'

const Apicase: Types.Apicase = {

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

  // Modify apicase object
  install (installer) {
    this.bus.emit('preinstall', this)
    installer(this)
    this.bus.emit('postinstall', this)
  },

  // Get a copy of apicase with modified state
  extend (installer) {
    const instance = clone(this)
    instance.install(installer)
    return instance
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
    const emit = (event: Types.EventName) => (data: mixed) => {
      switch (event) {
        case 'before':
        case 'start':
          this.bus.emit(event, { options })
          break
        case 'success':
          this.bus.emit(event, { data, options })
          break
        case 'error':
          this.bus.emit(event, { reason: data, options })
          break
        case 'finish':
          this.bus.emit(event, {
            success: data instanceof Object && 'data' in data,
            ...data,
            options
          })
          break
        default:
          this.bus.emit(event, { data, options })
      }
      return data
    }
    emit('before')()
    await h.before(query)
    return new Promise((resolve, reject) => {
      const success = async data => {
        emit('finish')({ data })
        await h.finish({ success: true, data })
        resolve(data)
      }
      const error = async reason => {
        emit('finish')({ reason })
        await h.finish({ success: false, reason })
        reject(reason)
      }
      emit('start')()
      this.adapters[adapter]({
        options: query,
        done: pipeM(emit('success'), h.success, success),
        fail: pipeM(emit('error'), h.error, error),
        another: (name, data, fail = false) =>
          pipeM(emit(name), h[name], ...(fail ? [reject] : []))(data)
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
  },

  // Events handling
  on (event, callback) {
    return this.bus.on(event, callback)
  },

  // Events emmiter for
  bus: new NanoEvents

}

export default Apicase

if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Apicase-core is available in browser console via Apicase global variable')
  window.Apicase = Apicase
}
