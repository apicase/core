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

function callHooks(hooks, opts) {
  return !hooks.length
    ? Promise.resolve({ status: 'next', payload: opts.payload })
    : Promise.resolve(opts)
        .then(function(opts) {
          return hooks[0](opts)
        })
        .then(function(res) {
          opts = clone(opts)
          opts.payload = res.payload
          return res.status === 'next' ? callHooks(hooks.slice(1), opts) : res
        })
}

function callFinalHooks(res) {
  const opts = {
    payload: res.payload,
    next: setStatus('next')
  }
  switch (res.status) {
    case 'resolve':
      opts.reject = setStatus('reject')
      break
    case 'reject':
      opts.resolve = setStatus('resolve')
      break
    default:
      break
  }
  return callHooks(res.hooks[res.status], opts).then(function(r) {
    return Promise[r.status === 'next' ? res.status : r.status](r.payload)
  })
}

export default function apicase(adapter) {
  return function(req, opts) {
    opts = opts || {}
    req = opts.disableNormalization ? req : normalizeOptions(adapter, req)
    if (
      process.env.NODE_ENV !== 'production' &&
      (!req.adapter || typeof req.adapter.callback !== 'function')
    ) {
      throw new TypeError(
        '[Apicase] Adapter should be an object with callback function'
      )
    }

    function processCustomHook(type, opts) {
      callHooks(
        req.hooks[type],
        Object.assign({}, opts, {
          next: setStatus('next'),
          resolve: setStatus('resolve'),
          reject: setStatus('reject')
        })
      ).then(function(res) {
        if (res.status === 'resolve' || res.status === 'reject') {
          resolve(setStatus(res.status)(res.payload))
        }
      })
    }

    function processAdapter(res) {
      return res.status === 'next'
        ? new Promise(function(resolve) {
            return req.adapter.callback({
              payload: res.payload,
              resolve(payload) {
                resolve(setStatus('resolve')(payload))
              },
              reject(payload) {
                resolve(setStatus('reject')(payload))
              },
              callHook: processCustomHook
            })
          })
        : setStatus(res.status, true)(res.payload, res.opts)
    }

    function processFinalHooks(res) {
      return res.opts.skipHooks
        ? Promise[res.status](res.payload)
        : callFinalHooks({
            status: res.status,
            hooks: req.hooks,
            meta: req.meta,
            payload: res.payload
          })
    }

    return callHooks(req.hooks.before, {
      payload: req.payload,
      meta: req.meta,
      next: setStatus('next'),
      resolve: setStatus('resolve', true),
      reject: setStatus('reject', true)
    })
      .then(processAdapter)
      .then(processFinalHooks)
  }
}
