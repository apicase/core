var normalizers = {
  // adapter(adapter, adapters) {
  //   if (process.env.NODE_ENV !== 'production') {
  //     // if (typeof adapter !== 'string' && typeof adapter !== 'object') {
  //     //   throw new Error(
  //     //     '[Apicase] Expected adapter to be String or Object, ' +
  //     //       adapter +
  //     //       ' given'
  //     //   )
  //     // }
  //     // if (!adapters[adapter]) {
  //     //   throw new Error('[Apicase] Adapter ' + adapter + ' not found')
  //     // }
  //   }
  //   return typeof adapter === 'string' ? adapters[adapter] : adapter
  // },
  payload(payload, opts) {
    return opts.adapter.convert ? opts.adapter.convert(payload) : payload
  },
  hooks(hooks) {
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

export default function normalizeOptions(opts, adapters) {
  opts.adapter =
    typeof opts.adapter === 'string' ? adapters[opts.adapter] : opts.adapter

  return Object.keys(opts).reduce(
    function(acc, key) {
      acc[key] = normalizers[key]
        ? normalizers[key](opts[key], opts)
        : opts[key]
      return acc
    },
    {
      adapter: null,
      payload: null,
      hooks: { before: [], resolve: [], reject: [] }
    }
  )
}
