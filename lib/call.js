import clone from 'nanoclone'
import normalizeOptions from './normalize'

var states = {
  next: 'next',
  resolve: 'resolve',
  reject: 'reject'
}

function setStatus(name, acceptOpts) {
  return function(payload, opts) {
    var res = {
      status: states[name],
      payload: payload,
      opts: acceptOpts ? opts || {} : {}
    }
    return res
  }
}

function callHooks(hooks, opts, wasStarted) {
  return !hooks.length
    ? Promise.resolve({ status: 'next', payload: opts.payload })
    : Promise.resolve(opts)
        .then(function(opts) {
          return hooks[0](opts)
        })
        .then(function(res) {
          opts = clone(opts)
          opts.payload = res.payload
          return res.status === 'next'
            ? callHooks(hooks.slice(1), opts, true)
            : res
        })
}

function callFinalHooks(res) {
  const opts = {
    payload: res.payload,
    next: setStatus('next')
  }
  if (res.status === 'resolve') opts.reject = setStatus('reject')
  else opts.resolve = setStatus('resolve')
  return callHooks(res.hooks[res.status], opts).then(function(r) {
    return Promise[r.status === 'next' ? res.status : r.status](r.payload)
  })
}

export default function apicase(adapter) {
  return function(req) {
    req = normalizeOptions(adapter, req)

    return callHooks(req.hooks.before, {
      payload: req.payload,
      meta: req.meta,
      next: setStatus('next'),
      resolve: setStatus('resolve', true),
      reject: setStatus('reject', true)
    })
      .then(function(res) {
        return res.status === 'next'
          ? new Promise(function(resolve) {
              return req.adapter.callback({
                payload: res.payload,
                resolve(payload) {
                  resolve(setStatus('resolve')(payload))
                },
                reject(payload) {
                  resolve(setStatus('reject')(payload))
                }
              })
            })
          : setStatus(res.status, true)(res.payload, res.opts)
      })
      .then(function(res) {
        return res.opts.skipHooks
          ? Promise[res.status](res.payload)
          : callFinalHooks({
              status: res.status,
              hooks: req.hooks,
              meta: req.meta,
              payload: res.payload
            })
      })
  }
}
