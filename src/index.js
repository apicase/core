var clone = require('nanoclone')
var compose = require('koa-compose')
var NanoEvents = require('nanoevents')

var log = require('./log')
var utils = require('./utils')
var merge = require('./merge')
var hooks = require('./hooks')
var check = require('./check')

var xhrAdapter = require('apicase-adapter-xhr')
var fetchAdapter = require('apicase-adapter-fetch')

// Global config is outside Apicase
// because of no need to store, mutate and clone it there
var globalConfig = {
  silent: false,
  defaultAdapter: 'fetch',
  adapters: {
    xhr: { callback: xhrAdapter },
    fetch: { callback: fetchAdapter }
  }
}

var Apicase = function (options) {
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

  // Call installer with apicase instance and additional options
  // use it in plugins to add new features
  this.use = function (installer, options) {
    this.bus.emit('preinstall', this)
    installer(this, options)
    this.bus.emit('postinstall', this)
  }

  // Like .use but clones instance
  this.extend = function (installer, options) {
    var cloned = clone(this)
    cloned.use(installer, options)
    Object.setPrototypeOf(cloned, this)
    return cloned
  }

  // Creates a service from optiosn
  // you can pass a part of query/hooks/interceptors
  // to reduce boilerplate code
  this.of = function (options) {
    var instance = this
    var cloned = Object.assign({}, instance, {
      base: merge(instance.base, {
        hooks: options.hooks,
        query: utils.omit(['hooks', 'interceptors'], options),
        interceptors: options.interceptors
      }),
      bus: clone(instance.bus)
    })
    Object.setPrototypeOf(cloned, this)
    return cloned
  }

  // Make API request
  this.call = function () {
    var instance = this

    // Apicase.call(1, 2, 3) now is equal with
    // Promise.all([Apicase.call(1), Apicase.call(2), Apicase.call(3)])
    if (arguments.length > 1) {
      var queries = Array.prototype.slice.call(arguments)
      return Promise.all(queries.map(utils.unary(instance.call)))
    }

    // First argument is options object
    var options = arguments[0]

    // Meta info about hook calls (for future debugging needs)
    // + calls abortion
    var meta = {
      isAborted: false,
      abortReason: null,
      hooks: {}
    }

    // Merged options
    // TODO: Merge strategies for query
    var o = merge(this.base, !options ? {} : {
      hooks: options.hooks,
      query: utils.omit(['hooks', 'interceptors'], options),
      interceptors: options.interceptors
    })

    // Adapter callback
    var adapterName = o.query.adapter || globalConfig.defaultAdapter
    var adapter = globalConfig.adapters[adapterName]
    if (!adapter) {
      log.error(
        'Adapter ' + adapterName + ' not found',
        new ReferenceError('Adapter ' + adapterName + ' not found')
      )
    }

    // Call interceptors of needed type for passed contenxt
    function callInterceptors (type, context, cbMeta) {
      var result = {
        isStateChanged: false,
        context: clone(context)
      }
      var interceptors = o.interceptors[type]
      function changeState (nextContext) {
        result.isStateChanged = true
        result.context = nextContext
      }
      if (!interceptors) return result
      for (var index in interceptors) {
        var stepContext =
          type === 'before'
            ? interceptors[index](context)
            : interceptors[index](context, changeState, cbMeta || { isStateChanged: false })
        if (result.isStateChanged) return result
        result.context = stepContext
      }

      return result
    }

    // Call hooks of needed type with passed context
    // also accepts additional callbacks
    function callHooks (type, context, additionalCb) {
      // I really don't want to mutate context/options in hooks
      // use interceptors instead
      var clonedContext = clone(context)
      var clonedOptions = clone(o.query)

      // Meta info for debugging
      meta.hooks[type] = {
        called: 0,
        all: (o.hooks[type] && o.hooks[type].length) || 0
      }

      var h = (o.hooks[type] || [])
        .concat(additionalCb || [])
        .map(hooks.wrapper(type, meta, clonedOptions))

      instance.emit(type, clonedContext, clonedOptions)

      return compose(h)(clonedContext)
        .then(function checkHookCalls () {
          if (!globalConfig.silent) {
            check.isAllHooksCalled(type, meta)
          }
        })
    }

    // Call adapter and then do some things
    // TODO: reduce boilerplate code
    function callAdapter (resolve, reject) {
      var done = function doneCallback (data, cbMeta) {
        var res = callInterceptors('success', data, cbMeta)

        if (res.isStateChanged) {
          fail(res.context, { isStateChanged: true })
        } else {
          callHooks('success', res.context, resolve)
            .then(() => {
              callHooks('finished', res.context)
            })
        }
      }

      var fail = function failCallback (reason, cbMeta) {
        var res = callInterceptors('error', reason, cbMeta)

        if (res.isStateChanged) {
          done(res.context, { isStateChanged: true })
        } else {
          callHooks('error', res.context, reject)
            .then(() => {
              callHooks('finished', res.context)
            })
        }
      }

      var customHook = function customCallback (type, data, isError, cbMeta) {
        var res = callInterceptors(type, data, cbMeta)

        // If custom hook should reject promise
        // but interceptors are changed state
        // it will be resolved
        // otherwise it will be rejected
        if (res.isStateChanged) {
          if (isError) {
            done(res.context, { isStateChanged: true })
          } else {
            fail(res.context, { isStateChanged: true })
          }
        } else {
          callHooks(type, res.context, isError ? reject : null)
        }
      }

      var callAdapter = function callAnotherAdapter (name, options) {
        if (!(name in instance.options.adapters)) {
          log.error(
            'Adapter ' + name + ' not found',
            'in high-order adapter' + o.query.adapter,
            new ReferenceError('Adapter ' + name + ' not found')
          )
        }
        var adapter = instance.options.adapters[name]
        return adapter.callback({
          adapter,
          instance,
          done,
          fail,
          customHook,
          callAdapter,
          options: options === undefined
            ? o.query
            : options
        })
      }

      adapter.callback({
        adapter,
        instance,
        done,
        fail,
        customHook,
        callAdapter,
        options: o.query
      })
    }
    // Transform query with interceptors
    o.query = callInterceptors('before', o.query).context

    return new Promise(function makeCall (resolve, reject) {
      callHooks('before', {})
        .then(function onBeforeHooksSuccess () {
          if (meta.isAborted) {
            callHooks('aborted', { reason: meta.abortReason }, reject)
          } else {
            callAdapter(resolve, reject)
          }
        })
    })
  }

  // CAUTION: It will be removed in next version
  // Now it just calls apicase.call(...queries)
  this.all = function (options) {
    return this.call.apply(this, options)
  }

  // Returns instance with .call() wrapped into a function
  // that make calls with options converted by a callback
  this.transform = function (wrapper) {
    return this.extend(function callTransformer (i) {
      var realCall = clone(i.call).bind(i)

      i.call = function transformer () {
        var options = Array.prototype.slice.call(arguments)
          .map(utils.unary(wrapper))

        return options.length <= 1
          ? realCall(options[0])
          : Promise.all(options.map(utils.unary(realCall)))
      }
    })
  }

  // Like .transform() but does .call(...options) for returned array
  this.transformSpread = function (wrapper) {
    return this.extend(function callSpreadTransformer (i) {
      var realCall = clone(i.call).bind(i)

      i.call = function spreadTransformer () {
        var options = Array.prototype.slice.call(arguments)
          .reduce((acc, cur) => acc.concat(wrapper(cur)), [])

        return options.length <= 1
          ? realCall(options[0])
          : Promise.all(options.map(utils.unary(realCall)))
      }
    })
  }

  // Calls chaining with any options
  // accepts objects / functions with passed previous result
  // or apicase instances (will use .call() method)
  this.queue = function (options, lastData) {
    if (!options.length) return lastData
    var instance = this

    // Just call queue again without first data
    function nextQueue (data) {
      return instance.queue(options.slice(1), data)
    }

    // Use .call() if it's Apicase instance
    if (options[0] instanceof Apicase) {
      return options[0].call(lastData)
        .then(nextQueue)
    }

    // Make a call with options object
    // or with options returned by function passed
    var option =
      typeof options[0] === 'function'
        ? options[0](lastData)
        : options[0]

    return instance
      .call(option)
      .then(nextQueue)
  }

  // Events bus to handle service calls anywhere
  this.bus = new NanoEvents()

  // Shortcut for .bus.on(event, callback)
  this.on = function (event, callback) {
    return this.bus.on(event, callback)
  }

  // Shortcut for .bus.emit(event, ...arguments)
  this.emit = function () {
    this.bus.emit.apply(this.bus, arguments)
  }

  return this
}

// Add new adapter
Apicase.addAdapter = function (name, adapter) {
  globalConfig.adapters[name] =
    typeof adapter === 'function'
      ? { callback: adapter }
      : adapter
  if (!globalConfig.silent) {
    check.isAdapterInstalledCorrectly(name, globalConfig.adapters)
  }
}

// Add silent property from global config to Apicase
Object.defineProperty(Apicase, 'silent', {
  get () {
    return globalConfig.silent
  },
  set (val) {
    globalConfig.silent = val
  }
})

module.exports = Apicase
