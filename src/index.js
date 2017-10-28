// @flow
import { tap, pipe, clone } from 'ramda'
import * as Types from './types'
import NanoEvents from 'nanoevents'
import xhrAdapter from './adapters/xhr'
import fetchAdapter from './adapters/fetch'
import { pipeM, curryBus, mergeHooks, mergeOptions, createHandler, mapComposeHooks, normalizeInterceptors, mergeInterceptors, filterInterceptors } from './utils'

const Apicase: Types.Apicase = {

  // Base for calls
  base: {
    query: {},
    hooks: {},
    interceptors: {
      before: [],
      success: [],
      error: [],
      abort: []
    }
  },

  // Options
  options: {
    defaultAdapter: 'fetch',
    newHandlers: false
  },

  // Built-in adapters for fetch and XMLHttpRequest
  adapters: {
    fetch: fetchAdapter,
    xhr: xhrAdapter
  },

  // Use it to add a new adapter
  use (name, adapter) {
    if (typeof adapter === 'function') {
      this.adapters[name] = {
        handler: adapter
      }
      return
    }
    this.adapters[name] = adapter
    const interceptors = adapter.interceptors
    if (interceptors) {
      const request = normalizeInterceptors(interceptors.request, name)
      const response = normalizeInterceptors(interceptors.response, name)
      this.base.interceptors.request.concat(request)
      this.base.interceptors.request.concat(response)
    }
  },

  // Modify apicase object
  install (installer, options) {
    this.bus.emit('preinstall', this)
    installer(this, options)
    this.bus.emit('postinstall', this)
  },

  // Get a copy of apicase with modified state
  extend (installer, options) {
    const instance = clone(this)
    instance.install(installer, options)
    return instance
  },

  async call ({
    adapter = this.options.defaultAdapter,
    hooks = {},
    interceptors = {},
    ...query
  }) {
    const h = pipe(mergeHooks, mapComposeHooks)(this.base.hooks, hooks)
    const emit = curryBus(this.bus)
    let options = mergeOptions(this.base.query, query)
    const handle = createHandler(emit, h)
    const intrcptrs = pipe(mergeInterceptors, filterInterceptors(adapter))(this.base.interceptors, interceptors)
    const state = {
      hooks: {
        isAborted: false,
        abortReason: null
      },
      interceptors: {
        isOK: true,
        stopData: null,
        wasFailed: false,
        wasSuccess: false
      }
    }

    intrcptrs.before.forEach(i => {
      options = i.handler({ options })
    })

    await handle('before')({
      options,
      abort: (reason) => {
        state.hooks.isAborted = true
        state.hooks.abortReason = reason
      }
    })

    if (state.hooks.isAborted) {
      intrcptrs.abort.forEach(i => {
        options = i.handler({ options })
      })
      emit('aborted')({ options, reason: state.hooks.abortReason })
      return Promise.reject({ options, reason: state.hooks.abortReason })
    }

    return new Promise(async (resolve, reject) => {
      const done = async data => {
        let clonedData = clone(data)
        state.interceptors.isOK = true
        state.interceptors.wasSuccess = true
        const stop = data => {
          state.interceptors.isOK = false
          if (data !== undefined) {
            clonedData = data
          }
        }
        for (const i of intrcptrs.success) {
          const payload = {
            options,
            data: clonedData,
            wasFailed: state.interceptors.wasFailed
          }
          const res = i.handler(payload, stop)
          if (!state.interceptors.isOK) {
            fail(clonedData)
            return
          }
          clonedData = res
        }
        await handle('success')({ data: clonedData, options })
        resolve(clonedData)
      }

      const fail = async reason => {
        let clonedReason = clone(reason)
        state.interceptors.isOK = true
        state.interceptors.wasFailed = true
        const stop = data => {
          state.interceptors.isOK = false
          if (data !== undefined) {
            clonedReason = data
          }
        }
        for (const i of intrcptrs.error) {
          const payload = {
            options,
            reason: clonedReason,
            wasSuccess: state.interceptors.wasSuccess
          }
          const res = i.handler(payload, stop)
          if (!state.interceptors.isOK) {
            done(clonedReason)
            return
          }
          clonedReason = res
        }
        await handle('success')({ reasopn: clonedReason, options })
        reject(clonedReason)
      }

      this.adapters[adapter]({
        done,
        fail,
        options,
        instance: this,
        another: (name, data, fail = false) =>
          pipeM(handle(name), ...(fail ? [reject] : []))(data)
      })
    })
  },

  // Like Promise.all but iteratees over calls options
  all (queries) {
    return Promise.all(queries.map(q => this.call(q)))
  },

  // Make a service with prepared options
  // Options from call() and all() methods will be merged with service options
  of ({ hooks = {}, interceptors = {}, ...options }) {
    return {
      ...this,
      base: {
        query: mergeOptions(this.base.query, options),
        hooks: mergeHooks(this.base.hooks, hooks),
        interceptors: mergeInterceptors(this.base.interceptors)(interceptors)
      }
    }
  },

  // Events handling
  on (event, callback) {
    return this.bus.on(event, callback)
  },

  // Emiting events
  emit (event, ...data) {
    return this.bus.emit(event, ...data)
  },

  // Events emmiter for
  bus: new NanoEvents

}

export default Apicase

if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Apicase-core is available in browser console via Apicase global variable')
  window.Apicase = Apicase
}
