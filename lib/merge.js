import defaults from './defaults'
import { map, clone, merge, mergeWith, mapObjIndexed } from 'nanoutils'
import { normalizeOptions } from './normalize'

const mergers = {
  adapter: adapter => (from, to) => from || to,

  hooks: adapter => mergeWith((from, to) => (from || []).concat(to)),

  meta: adapter => mergeWith((from, to) => to),

  payload: adapter => (adapter && adapter.merge ? adapter.merge : merge)
}

// TODO: refactor it
const mergeOptions = (adapter, opts) => {
  opts = opts.map(opt =>
    normalizeOptions(adapter, clone(typeof opt === 'function' ? opt() : opt))
  )
  const cbs = map(cb => cb(adapter), mergers)
  const def = clone(defaults)

  return opts.reduce(
    (res, cur) => ({
      ...res,
      ...mapObjIndexed(
        (val, key) => (cbs[key] ? cbs[key](res[key], val) : val),
        cur
      )
    }),
    def
  )
}

export { mergeOptions }
