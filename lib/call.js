import normalizeOptions from './normalize'

var adapters = {}

var states = {
  next: 'next',
  resolve: 'resolve',
  reject: 'reject'
}

function getAdapter(adapter) {
  return typeof adapter === 'string' ? adapters[adapter] : adapter
}

function setStatus(name, acceptMeta) {
  return function(data, meta) {
    var res = {
      status: states[name],
      data,
      meta: acceptMeta ? meta || {} : {}
    }
    return res
  }
}

function callHooks(hooks, data, cbs, wasStarted) {
  return !hooks.length
    ? Promise.resolve({ status: states.next, data })
    : Promise.resolve(data)
        .then(function(data) {
          return hooks[0](data, cbs)
        })
        .then(function(res) {
          return res.status === states.next
            ? callHooks(hooks.slice(1), res.data, cbs, true)
            : res
        })
}

function callFinalHooks(res) {
  const hooks = {
    next: setStatus('next')
  }
  if (res.status === states.resolve) hooks.reject = setStatus('reject')
  else hooks.resolve = setStatus('resolve')
  return callHooks(res.hooks[res.status], res.data, hooks).then(function(r) {
    return Promise[r.status === states.next ? res.status : r.status](r.data)
  })
}

export default function apicase(opts, meta) {
  meta = meta || {}
  opts = meta.disableNormalize ? opts : normalizeOptions(opts, adapters)

  return callHooks(opts.hooks.before, opts.payload, {
    next: setStatus('next', true),
    resolve: setStatus('resolve'),
    reject: setStatus('reject')
  })
    .then(function(res) {
      return res.status === states.next
        ? new Promise(function(resolve) {
            return opts.adapter.callback(res.data, {
              resolve(data) {
                resolve(setStatus('resolve')(data))
              },
              reject(data) {
                resolve(setStatus('reject')(data))
              }
            })
          })
        : setStatus(res.status.toUpperCase())(res.data)
    })
    .then(function(res) {
      return res.meta.skipHooks
        ? Promise[res.status](res.data)
        : callFinalHooks({
            status: res.status,
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
