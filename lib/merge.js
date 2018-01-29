import normalizeOptions from './normalize'

var mergers = {
  adapter(from, to) {
    return to || from
  },
  hooks(from, to) {
    return Object.keys(to).reduce(function(hooks, hookType) {
      hooks[hookType] = (hooks[hookType] || []).concat(to[hookType])
      return hooks
    }, from)
  },
  payload(from, to, adapter) {
    return adapter.merge ? adapter.merge(from, to) : to
  }
}

export default function mergeOptions(from, to) {
  to = normalizeOptions(to)
  from = normalizeOptions(from)
  return Object.keys(to).reduce(function(acc, key) {
    acc[key] = mergers[key]
      ? mergers[key](from[key], to[key], from.adapter || to.adapter)
      : to[key]
    return acc
  }, from)
}
