import normalizeOptions from './normalize'

var adapters = {}

var states = {
  NEXT: 0,
  RESOLVE: 1,
  REJECT: 2
}

function getAdapter(adapter) {
  return typeof adapter === 'string' ? adapters[adapter] : adapter
}

function createHookCallback(from) {
  return function(data, meta) {
    return Promise.resolve({ from, data: data || {}, meta: meta || {} })
  }
}

var nextCallback = createHookCallback(states.NEXT)
var resolveCallback = createHookCallback(states.RESOLVE)
var rejectCallback = createHookCallback(states.REJECT)

function callHooks(hooks, data, cbs, wasStarted) {
  return !hooks.length
    ? Promise.resolve({ from: states.NEXT, data })
    : Promise.resolve(data)
        .then(function(data) {
          return hooks[0](data, cbs)
        })
        .then(function(res) {
          return res.from === states.NEXT
            ? callHooks(hooks.slice(1), res.data, cbs, true)
            : res
        })
}

function callFinalHooks(res) {
  const hooks = {
    next: nextCallback
  }
  if (res.success) hooks.reject = rejectCallback
  else hooks.resolve = resolveCallback
  return callHooks(
    res.hooks[res.success ? 'resolve' : 'reject'] || [],
    res.data,
    hooks
  ).then(function(r) {
    return Promise[res.success ? 'resolve' : 'reject'](r.data)
  })
}

export default function apicase(opts, meta) {
  meta = meta || {}
  opts = meta.disableNormalize ? opts : normalizeOptions(opts, adapters)

  return callHooks(opts.hooks.before, opts.payload, {
    next: nextCallback,
    resolve: resolveCallback,
    reject: rejectCallback
  })
    .then(function(res) {
      switch (res.from) {
        case states.NEXT:
          return new Promise(function(resolve) {
            return opts.adapter.callback(res.data, {
              resolve: function(data) {
                resolve({ success: true, data })
              },
              reject: function(data) {
                resolve({ success: false, data })
              }
            })
          })
        case states.RESOLVE:
          return {
            success: true,
            data: res.data,
            skipHooks: res.meta.skipHooks || false
          }
        case states.REJECT:
          return {
            success: false,
            data: res.data,
            skipHooks: res.meta.skipHooks || false
          }
      }
    })
    .then(function(res) {
      return res.skipHooks
        ? Promise[res.success ? 'resolve' : 'reject'](res.data)
        : callFinalHooks({
            success: res.success,
            hooks: opts.hooks,
            data: res.data
          })
    })
}

apicase.addAdapters = function(obj) {
  Object.keys(obj).forEach(function(key) {
    adapters[key] = obj[key]
  })
}
