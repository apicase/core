import defaults from './defaults'
import { map, clone, merge, mergeWith, mapObjIndexed } from 'nanoutils'
import normalizeOptions from './normalize'

const mergers = {
  adapter: adapter => (from, to) => from || to,

  hooks: adapter => mergeWith((from, to) => (from || []).concat(to)),

  meta: adapter => mergeWith((from, to) => to),

  options: adapter => mergeWith((from, to) => to),

  payload: adapter => (adapter && adapter.merge ? adapter.merge : merge)
}

const createMergeReducer = cbs => (res, cur) =>
  Object.assign(
    res,
    mapObjIndexed((val, key) => (cbs[key] ? cbs[key](res[key], val) : val), cur)
  )

const mergeOptions = (adapter, opts) => {
  opts = opts.map(opt =>
    normalizeOptions(adapter, typeof opt === 'function' ? opt() : opt)
  )
  const cbs = map(cb => cb(adapter), mergers)
  const def = clone(defaults)
  const reducer = createMergeReducer(cbs)

  return opts.reduce(reducer, def)
}

export default mergeOptions
