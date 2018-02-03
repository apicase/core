import clone from 'nanoclone'
import defaultOptions from './defaults'

function omit(keys, obj) {
  return Object.keys(obj)
    .filter(function(key) {
      return !keys.includes(key)
    })
    .reduce(function(res, key) {
      res[key] = obj[key]
      return res
    }, {})
}

function evolve(callbacks, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callbacks[key] ? callbacks[key](obj[key], res, obj) : obj[key]
    return res
  }, {})
}

function evolveAll(callback, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callback(obj[key], key)
    return res
  }, {})
}

function defaults(def, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = obj[key] || res[key]
    return res
  }, clone(def))
}

var normalizers = {
  adapter(adapter) {
    return adapter || null
  },
  payload(payload, res, prev) {
    return !payload
      ? null
      : !res.adapter || !res.adapter.convert
        ? payload
        : res.adapter.convert(payload)
  },
  hooks(hooks) {
    if (!hooks) return {}
    return evolveAll(function(hooks, k) {
      if (process.env.NODE_ENV !== 'production') {
        ;(Array.isArray(hooks) ? hooks : [hooks]).forEach(function(hook, idx) {
          if (typeof hook !== 'function') {
            throw new TypeError(
              '[Apicase] ' + k + ' hook #' + idx + ' is not a function'
            )
          }
        })
      }
      return Array.isArray(hooks) ? hooks : [hooks]
    }, defaults(defaultOptions.hooks, hooks))
  }
}

function format(adapter, opts) {
  return {
    adapter: adapter,
    meta: opts.meta,
    hooks: opts.hooks,
    payload: omit(['adapter', 'meta', 'hooks'], opts)
  }
}

export default function normalizeOptions(adapter, opts) {
  return evolve(
    normalizers,
    defaults(defaultOptions, format(adapter, opts || {}))
  )
}
