import clone from 'nanoclone'
import defaultOptions from './defaults'
import { omit, evolve, evolveAll, defaults } from './utils'

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
