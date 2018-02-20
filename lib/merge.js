import defaults from './defaults'
import { clone, mergeWith } from 'nanoutils'
import { normalizeOptions } from './normalize'

const mergePreferNew = mergeWith((from, to) => (to !== undefined ? to : from))

const mergers = {
  adapter: (from, to) => from || to,

  hooks: mergeWith((from, to) => (from || []).concat(to)),

  meta: mergeWith((from, to) => to),

  payload(from, to, res) {
    return res.adapter && res.adapter.merge
      ? res.adapter.merge(from, to)
      : mergePreferNew(from, to)
  }
}

const mergeOptions = (adapter, opts) => {
  opts = opts.map(opt =>
    normalizeOptions(adapter, clone(typeof opt === 'function' ? opt() : opt))
  )
  const def = clone(defaults)
  return Object.keys(mergers).reduce((res, key) => {
    res[key] = opts.reduce(
      (opt, next, index, opts) =>
        mergers[key](opt, next[key], res, index, opts),
      def[key]
    )
    return res
  }, def)
}

export { mergeOptions }
