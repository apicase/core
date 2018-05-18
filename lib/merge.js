import defaults from './defaults'
import { clone, mergeWith, mapObjIndexed } from 'nanoutils'
import { normalizeOptions } from './normalize'

const mergers = {
  adapter: (from, to) => to || from,

  hooks: mergeWith((from, to) => (from || []).concat(to)),

  meta: mergeWith((from, to) => to)
}

const createMergeReducer = cbs => (res, cur) =>
  Object.assign(
    res,
    mapObjIndexed((val, key) => (cbs[key] ? cbs[key](res[key], val) : val), cur)
  )

export const mergeOptions = opts => {
  opts = opts.map(opt =>
    normalizeOptions(typeof opt === 'function' ? opt() : opt)
  )
  const def = clone(defaults)
  const reducer = createMergeReducer(mergers)

  const newOptions = opts.reduce(reducer, def)
  const payloadMerger =
    (newOptions.adapter && newOptions.adapter.merge) || Object.assign
  newOptions.payload = opts.reduce(
    (res, cur) => payloadMerger(res, cur.payload),
    {}
  )
  return newOptions
}
