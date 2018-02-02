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
    if (!payload) return null
    if (!res.adapter || !res.adapter.convert) return payload
    return res.adapter.convert(payload)
  },
  hooks(hooks) {
    if (!hooks) return {}
    return Object.keys(hooks).reduce(
      function(acc, hookType) {
        if (process.env.NODE_ENV !== 'production') {
          if (!Array.isArray(hooks[hookType])) {
            throw new Error(
              '[Apicase] Expected ' +
                hookType +
                ' hooks to be Array, ' +
                typeof hooks[hookType] +
                ' given'
            )
          }
        }
        acc[hookType] = hooks[hookType]
        return acc
      },
      { before: [], resolve: [], reject: [] }
    )
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
