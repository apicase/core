import clone from 'nanoclone'
import NanoEvents from 'nanoevents'

import mergeOptions from './mergeOptions'

const Apicase = {
  base: {
    query: {},
    hooks: {
      before: [],
      success: [],
      error: [],
      aborted: []
    },
    interceptors: {
      before: [],
      success: [],
      error: [],
      aborted: []
    }
  },

  options: {
    defaultAdapter: 'fetch',
    adapters: {}
  },

  use (name, adapter) {
    this.options.adapters[name] = adapter
  },

  async install (installer, options) {
    this.bus.emit('preinstall', this)
    await installer(this, options)
    this.bus.emit('postinstall', this)
  },

  extend (installer, options) {
    return clone(this).install(installer, options)
  },

  of ({ hooks, interceptors, ...query }) {
    return {
      ...this,
      base: mergeOptions(this.base, {
        query,
        hooks,
        interceptors
      })
    }
  },

  call ({ hooks, interceptors, ...query }) {
    const o = mergeOptions(this.base, {
        query,
        hooks,
        interceptors
      })
    console.log(o)
    // TODO: Complete this
  },

  all (options) {
    return Promise.all(options.map(q => this.call(q)))
  },

  on (event, callback) {
    return this.bus.on(event, callback)
  },

  emit (event, ...data) {
    this.bus.emit(event, ...data)
  },

  bus: new NanoEvents
}

export default Apicase
