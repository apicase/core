import defaultOptions from './defaults'
import { map, omit, clone, merge, mergeWith, mapObjIndexed } from 'nanoutils'

function normalize(callbacks, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callbacks[key] ? callbacks[key](obj[key], res, obj) : obj[key]
    return res
  }, {})
}

function mapObject(callback, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callback(obj[key], key)
    return res
  }, {})
}

var defaults = mergeWith(function(a, b) {
  return b === undefined ? a : b
})

var normalizers = {
  adapter(adapter) {
    return adapter || null
  },
  payload(payload, res, prev) {
    if (process.env.NODE_ENV !== 'production') {
      if (payload) {
        if (
          payload.adapter ||
          payload.meta ||
          payload.hooks ||
          payload.payload
        ) {
          console.warn(
            '[Apicase] Using reserved properties names (adapter, meta, hooks, payload) in payload is not recommended'
          )
        }
      }
    }
    return !payload
      ? null
      : !res.adapter || !res.adapter.convert
        ? payload
        : res.adapter.convert(payload)
  },
  hooks(hooks) {
    if (!hooks) return {}
    return mapObjIndexed(function(hooks, k) {
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
    }, merge(clone(defaultOptions.hooks), hooks))
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
  return normalize(
    normalizers,
    defaults(clone(defaultOptions), format(adapter, opts || {}))
  )
}
