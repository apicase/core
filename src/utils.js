import { is, of, map, set, join, keys, pipe, when, assoc, curry, merge, concat, reduce, isEmpty, toPairs, identity, complement } from 'ramda'

const isNotEmpty = complement(isEmpty)
const encodeParts = map(map(encodeURIComponent))
const joinParts = pipe(map(join('=')), join('&'))
const addQuestionSign = when(isNotEmpty, concat('?'))

// Convert json to QueryString
export const jsonToQueryString = pipe(toPairs, encodeParts, joinParts, addQuestionSign)

// Like R.over but use object in callback instead of prop
// TODO: Looking for point-free variant
export const overAll = curry((lens, cb, data) => set(lens, cb(data), data))

// Change prop name and return object
// TODO: Looking for point-free variant
export const rename = curry((keyFrom, keyTo, obj) =>
  reduce((acc, key) => assoc(key === keyFrom ? keyTo : key, obj[key], acc), {}, keys(obj))
)

// Helper for adapters to evaluate dynamically declared headers
export const evaluateHeaders = when(is(Function), h => h())

// Normalize hooks
export const normalizeHooks = pipe(
  merge({ before: [], success: [], error: [], finished: [] }),
  map(when(is(Function), of))
)

// Compose async functions
// Based on koa-compose idea (https://github.com/koajs/compose)
export const composeHooks = (...fns) => ctx =>
  fns.length === 0
    ? Promise.resolve(ctx)
    : Promise.resolve(fns[0](ctx, () =>
      composeHooks(...fns.slice(1))(ctx)
    ))

// Like R.pipeP but work with non-Promises too
export const pipeM = (...fns) => arg => {
  const res = fns[0](arg)
  const slice = fns.slice(1)
  const next = slice.length ? pipeM(...slice) : identity
  const isPromise = typeof res === 'object' && 'then' in res
  return isPromise ? res.then(i => next(i)) : next(res)
}
