var clone = require('nanoclone')
var compose = require('koa-compose')
var NanoEvents = require('nanoevents')

var omit = require('./omit')
var merge = require('./merge')
var hooks = require('./hooks')

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
    silent: false,
    defaultAdapter: 'resolve',
    adapters: {
      resolve (ctx) {
        setTimeout(ctx.done, ctx.time || 1000, ctx.options)
      },
      reject (ctx) {
        setTimeout(ctx.fail, ctx.time || 1000, ctx.options)
      }
    }
  },

  use (name, adapter) {
    this.options.adapters[name] = adapter
  },

  install (installer, options) {
    this.bus.emit('preinstall', this)
    installer(this, options)
    this.bus.emit('postinstall', this)
  },

  extend (installer, options) {
    var cloned = clone(this)
    cloned.install(installer, options)
    return cloned
  },

  of (options) {
    return Object.assign({}, this, {
      base: merge(this.base, {
        hooks: options.hooks,
        query: omit(['hooks', 'interceptors'], options),
        interceptors: options.interceptors
      })
    })
  },

  call (options) {
    var instance = this
    var o = merge(this.base, {
      hooks: options.hooks,
      query: omit(['hooks', 'interceptors'], options),
      interceptors: options.interceptors
    })
    var adapter = this.options.adapters[o.query.adapter || this.options.defaultAdapter]

    function callHooks (type, cb, context) {
      var ctx = Object.assign({}, context, { options: o.query })
      function endCallback (data, next) {
        cb(context.data || context.reason)
        next()
      }
      var h = o.hooks[type].concat(endCallback).map(hooks.wrapper(type))
      return compose(h)(ctx)
    }

    return new Promise(function makeCall (resolve, reject) {
      callHooks('before', [], { options: o.query })
        .then(function () {
          adapter({
            instance,
            options: o.query,
            done: function doneCallback (data) {
              return callHooks('success', resolve, { data })
            },
            fail: function failCallback (reason) {
              return callHooks('error', reject, { reason })
            },
            custom: function customCallback (type, data) {
              return callHooks(type, [], data)
            }
          })
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
