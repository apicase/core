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

function setStatus(name, acceptopts) {
  return function(data, opts) {
    var res = {
      status: states[name],
      data,
      opts: acceptopts ? opts || {} : {}
    }
    return res
  }
}

function callHooks(hooks, data, cbs, wasStarted) {
  return !hooks.length
    ? Promise.resolve({ status: 'next', data })
    : Promise.resolve(data)
        .then(function(data) {
          return hooks[0](data, cbs)
        })
        .then(function(res) {
          return res.status === 'next'
            ? callHooks(hooks.slice(1), res.data, cbs, true)
            : res
        })
}

function callFinalHooks(res) {
  const hooks = {
    next: setStatus('next')
  }
  if (res.status === 'resolve') hooks.reject = setStatus('reject')
  else hooks.resolve = setStatus('resolve')
  return callHooks(res.hooks[res.status], res.data, hooks).then(function(r) {
    return Promise[r.status === 'next' ? res.status : r.status](r.data)
  })
}

export default function apicase(req, opts) {
  opts = opts || {}
  req = opts.disableNormalize ? req : normalizeOptions(req, adapters)

  return callHooks(req.hooks.before, req.payload, {
    next: setStatus('next'),
    resolve: setStatus('resolve', true),
    reject: setStatus('reject', true)
  })
    .then(function(res) {
      return res.status === 'next'
        ? new Promise(function(resolve) {
            return req.adapter.callback(res.data, {
              resolve(data) {
                resolve(setStatus('resolve')(data))
              },
              reject(data) {
                resolve(setStatus('reject')(data))
              }
            })
          })
        : setStatus(res.status)(res.data)
    })
    .then(function(res) {
      return res.opts.skipHooks
        ? Promise[res.status](res.data)
        : callFinalHooks({
            status: res.status,
            hooks: req.hooks,
            data: res.data
          })
    })
}

apicase.addAdapters = function(obj) {
  Object.keys(obj).forEach(function(key) {
    adapters[key] = obj[key]
  })
}
