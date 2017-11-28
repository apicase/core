var clone = require('nanoclone')
var compose = require('koa-compose')
var NanoEvents = require('nanoevents')

var omit = require('./omit')
var merge = require('./merge')
var hooks = require('./hooks')
var adapters = require('./adapters')
var transformer = require('./transformer')
var check = process.env.NODE_ENV !== 'production'
  ? require('./check')
  : require('./nocheck')

var Apicase = function () {
  this.base = {
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
  }

  this.options = {
    silent: false,
    defaultAdapter: 'resolve',
    adapters: {
      resolve: {
        callback: function (ctx) {
          setTimeout(ctx.done, ctx.options.time || 1000, ctx.options.data)
        }
      },
      reject: {
        callback: function (ctx) {
          setTimeout(ctx.fail, ctx.options.time || 1000, ctx.options.data)
        }
      },
      testAdapter: {
        callback: function (ctx) {
          setTimeout(ctx.done, ctx.options.time || 1000, (ctx.options.transform && ctx.options.transform(ctx.options.data)) || ctx.options.data)
        }
      }
    }
  }

  this.use = function (name, adapter) {
    this.options.adapters[name] =
      typeof adapter === 'function'
        ? { callback: adapter }
        : adapter
    check.isAdapterInstalledCorrectly(name, this.options.adapters)
  }

  this.install = function (installer, options) {
    this.bus.emit('preinstall', this)
    installer(this, options)
    this.bus.emit('postinstall', this)
  }

  this.extend = function (installer, options) {
    var cloned = Object.assign({}, this)
    cloned.install(installer, options)
    Object.setPrototypeOf(cloned, this)
    return cloned
  }

  this.of = function (options) {
    var instance = this
    var cloned = Object.assign({}, instance, {
      base: merge(instance.base, {
        hooks: options.hooks,
        query: omit(['hooks', 'interceptors'], options),
        interceptors: options.interceptors
      }),
      bus: clone(instance.bus)
    })
    Object.setPrototypeOf(cloned, this)
    return cloned
  }

  this.call = function () {
    var instance = this
    // TODO: return to .all() if it's OK
    if (arguments.length > 1) {
      var queries = []
      for (var index in arguments) {
        queries.push(arguments[index])
      }
      return Promise.all(queries.map(function optionsToCall (query) {
        return instance.call(query)
      }))
    }

    var options = arguments[0]

    var meta = {
      isAborted: false,
      abortReason: null,
      hooks: {}
    }

    var o = merge(this.base, !options ? {} : {
      hooks: options.hooks,
      query: omit(['hooks', 'interceptors'], options),
      interceptors: options.interceptors
    })

    o.query = o.interceptors.before.reduce((res, cb) => cb(res), o.query)

    var adapter = this.options.adapters[o.query.adapter || this.options.defaultAdapter].callback

    function callHooks (type, cb, context) {
      var transformedContext =
        o.interceptors[type]
          ? o.interceptors[type].reduce((res, cb) => cb(res), context)
          : context

      var ctx = Object.assign({}, transformedContext, { options: o.query })

      function endCallback (data, next) {
        if (cb) {
          cb(context.data || context.reason)
        }
      }

      meta.hooks[type] = {
        called: 0,
        all: o.hooks[type].length
      }

      var h = o.hooks[type]
        .concat(endCallback)
        .map(hooks.wrapper(type, meta))

      instance.emit(type, ctx)

      return compose(h)(ctx)
        .then(function () {
          check.isAllHooksCalled(type, meta)
        })
    }

    function callAdapter (resolve, reject) {
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
    }

    return new Promise(function makeCall (resolve, reject) {
      callHooks('before', null, {})
        .then(function () {
          if (meta.isAborted) {
            callHooks('aborted', reject, { reason: meta.abortReason })
          } else {
            callAdapter(resolve, reject)
          }
        })
    })
  }

  // NOTE: It will be removed in next version
  // Now it just calls apicase.call(...queries)
  this.all = function (options) {
    return this.call.apply(this, options)
  }

  // TODO: test again and rethink
  this.map = function (callback) {
    return transformer.transform(this, 'call', transformer.create(callback))
  }

  this.flatMap = function (callback) {
    return transformer.transform(this, 'all', transformer.create(callback))
  }

  this.method = function (method) {
    this.options.pipeMethod = method
    return this
  }

  this.queue = function (options, lastData) {
    if (!options.length) return lastData
    var instance = this

    function nextQueue (data) {
      return instance.queue(options.slice(1), data)
    }

    if (options[0] instanceof Apicase) {
      return options[0].call(lastData)
        .then(nextQueue)
    }

    var option =
      typeof options[0] === 'function'
        ? options[0](lastData)
        : options[0]

    return instance
      .call(option)
      .then(nextQueue)
  }

  this.bus = new NanoEvents()

  this.on = function (event, callback) {
    return this.bus.on(event, callback)
  }

  this.emit = function () {
    this.bus.emit.apply(this.bus, arguments)
  }

  return this
}

var instance = new Apicase()

module.exports = instance
