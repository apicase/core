import clone from 'nanoclone'
import defaults from './defaults'

var normalizers = {
  adapter(adapter, resOpts, prevOpts, adapters) {
    if (!adapter) return null
    return typeof adapter === 'string' ? adapters[adapter] : adapter
  },
  payload(payload, resOpts, prevOpts) {
    if (!payload) return null
    return resOpts.adapter && resOpts.adapter.convert
      ? resOpts.adapter.convert(payload)
      : payload
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

export default function normalizeOptions(prevOpts, adapters) {
  prevOpts = prevOpts || {}

  return Object.keys(prevOpts).reduce(function(resOpts, key) {
    resOpts[key] = normalizers[key]
      ? normalizers[key](prevOpts[key], resOpts, prevOpts, adapters)
      : prevOpts[key]
    return resOpts
  }, clone(defaults))
}
