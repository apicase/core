var clone = require('nanoclone')
var NanoEvents = require('nanoevents')

var omit = require('./omit')
var mergeOptions = require('./mergeOptions')

module.exports = {
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

  of (options) {
    return Object.assign({}, this, {
      base: mergeOptions(this.base, {
        hooks: options.hooks,
        query: omit(['hooks', 'interceptors'], options),
        interceptors: options.interceptors
      })
    })
  },

  call (options) {
    var o = mergeOptions(this.base, {
      hooks: options.hooks,
      query: omit(['hooks', 'interceptors'], options),
      interceptors: options.interceptors
    })

    var adapter = this.options.adapters[o.query.adapter || this.options.defaultAdapter]

    return new Promise(function (resolve, reject) {
      adapter({
        done: resolve,
        fail: reject
      })
    })
  },

  all (options) {
    return Promise.all(options.map(q => this.call(q)))
  },

  on (event, callback) {
    return this.bus.on(event, callback)
  },

  emit () {
    this.bus.emit.apply(this.bus, arguments)
  },

  // BUG: bus doesnt' work (process is not defined)
  bus: new NanoEvents()
}
