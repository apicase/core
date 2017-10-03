import { is, map, set, join, keys, pipe, when, assoc, curry, concat, reduce, isEmpty, toPairs, identity, complement } from 'ramda'

const isNotEmpty = complement(isEmpty)
const encodeParts = map(map(encodeURIComponent))
const joinParts = pipe(map(join('=')), join('&'))
const addQuestionSign = when(isNotEmpty, concat('?'))

// TODO: Looking for point-free variants

// Convert json to QueryString
export const jsonToQueryString = pipe(toPairs, encodeParts, joinParts, addQuestionSign)

// Like R.over but use object in callback instead of prop
export const overAll = curry((lens, cb, data) => set(lens, cb(data), data))

// Change prop name and return object
export const rename = curry((keyFrom, keyTo, obj) =>
  reduce((acc, key) => assoc(key === keyFrom ? keyTo : key, obj[key], acc), {}, keys(obj))
)

// Like R.pipeP but work with non-Promises too
export const pipeM = (...fns) => arg => {
  const res = fns[0](arg)
  const slice = fns.slice(1)
  const next = slice.length ? pipeM(...slice) : identity
  const isPromise = typeof res === 'object' && 'then' in res
  return isPromise ? res.then(i => next(i)) : next(res)
}

// Helper for adapters to evaluate dynamically declared headers
export const evaluateHeaders = when(is(Function), h => h())

// Compose async
