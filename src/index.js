var clone = require('nanoclone')
var compose = require('koa-compose')
var NanoEvents = require('nanoevents')

var omit = require('./omit')
var merge = require('./merge')
var hooks = require('./hooks')
var transformer = require('./transformer')
var check = require('./check')

var xhrAdapter = require('apicase-adapter-xhr')
var fetchAdapter = require('apicase-adapter-fetch')

var Apicase = function (options) {
  var convertedOptions = {
    silent: false,
    defaultAdapter: 'fetch'
  }

  if (options) {
    if ('silent' in options) {
      convertedOptions.silent = options.silent
    }
    if ('defaultAdapter' in options) {
      convertedOptions.silent = options.defaultAdapter
    }
  }

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
    silent: convertedOptions.silent,
    defaultAdapter: convertedOptions.defaultAdapter,
    adapters: {
      xhr: { callback: xhrAdapter },
      fetch: { callback: fetchAdapter }
    }
  }

  // Adds new adapter
  this.use = function (name, adapter) {
    this.options.adapters[name] =
      typeof adapter === 'function'
        ? { callback: adapter }
        : adapter
    if (!this.options.silent) {
      check.isAdapterInstalledCorrectly(name, this.options.adapters)
    }
  }

  // Call installer with apicase instance and additional options
  // use it in plugins to add new features
  this.install = function (installer, options) {
    this.bus.emit('preinstall', this)
    installer(this, options)
    this.bus.emit('postinstall', this)
  }

  // Like .install but clones instance
  this.extend = function (installer, options) {
    var cloned = Object.assign({}, this)
    cloned.install(installer, options)
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
        query: omit(['hooks', 'interceptors'], options),
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
      var queries = []
      for (var index in arguments) {
        queries.push(arguments[index])
      }
      return Promise.all(queries.map(function optionsToCall (query) {
        return instance.call(query)
      }))
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
      query: omit(['hooks', 'interceptors'], options),
      interceptors: options.interceptors
    })

    // Adapter callback
    var adapter = this.options.adapters[o.query.adapter || this.options.defaultAdapter]

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
    function callHooks (type, context, cb) {
      // I really don't want to mutate context/options in hooks
      // use interceptors instead
      var clonedContext = clone(context)
      var clonedOptions = clone(o.query)

      meta.hooks[type] = {
        called: 0,
        all: (o.hooks[type] && o.hooks[type].length) || 0
      }

      var h = (o.hooks[type] || [])
        .concat(cb || [])
        .map(hooks.wrapper(type, meta, clonedOptions))

      instance.emit(type, clonedContext, clonedOptions)

      return compose(h)(clonedContext)
        .then(function checkHookCalls () {
          if (!instance.options.silent) {
            check.isAllHooksCalled(type, meta)
          }
        })
    }

    // Call adapter and then do some things
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

      var custom = function customCallback (type, data, isError, cbMeta) {
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

      adapter.callback({
        adapter,
        instance,
        done,
        fail,
        custom,
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
  this.transform = function (callback) {
    return transformer.transform(this, 'call', transformer.create(callback))
  }

  // Like .transform() but do .call(...options) for returned array
  this.transformFlat = function (callback) {
    return transformer.transform(this, 'all', transformer.create(callback))
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

module.exports = Apicase
