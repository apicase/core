// @flow
import * as Types from './types'
import { is, of, map, set, join, keys, pipe, when, assoc, curry, merge, concat, reduce, isEmpty, toPairs, identity, mergeWith, complement, mergeDeepRight } from 'ramda'

/* Returns true if object is not empty */
const isNotEmpty: Types.isNotEmpty = complement(isEmpty)

/* Encode pairs of query data */
const encodePairs: Types.encodePairs = map(map(encodeURIComponent))

/* Build query string from pairs of query data */
const joinParts: Types.joinParts = pipe(map(join('=')), join('&'))

/* Adds question sign to start if QueryString is not empty */
const addQuestionSign: Types.addQuestionSign = when(isNotEmpty, ('?'))

/* Convert json to QueryString */
export const jsonToQueryString: Types.jsonToQueryString = pipe(toPairs, encodePairs, joinParts, addQuestionSign)

/* Like R.over but use object in callback instead of prop */
export const overAll: Types.overAll = curry((lens, cb, data) =>
  set(lens, cb(data), data)
)

/* Change prop name and return object */
export const rename: Types.rename = curry((keyFrom, keyTo, obj) =>
  reduce((acc, key) => assoc(key === keyFrom ? keyTo : key, obj[key], acc), {}, keys(obj))
)

/* Compose async functions. Based on koa-compose idea (https://github.com/koajs/compose) */
// BUG: Fix composeHooks return value
export const composeHooks: Types.composeHooks = (fns) => async (ctx) =>
  fns.length === 0
    ? ctx
    : await fns[0](ctx, () =>
      composeHooks(fns.slice(1))(ctx)
    ) || ctx

/* Like R.pipeP but work with non-Promises too */
export const pipeM: Types.pipeM = (...fns) => (arg) => {
  const res = fns[0](arg)
  const slice = fns.slice(1)
  const next = slice.length ? pipeM(...slice) : identity
  const isPromise = typeof res === 'object' && 'then' in res
  return isPromise ? res.then(i => next(i)) : next(res)
}

/* Helper for adapters to evaluate dynamically declared headers */
export const evaluateHeaders: Types.evaluateHeaders = when(is(Function), h => h())

// BUG: ???
/* Normalize hooks */
export const normalizeHooks: Types.normalizeHooks = pipe(
  merge({ before: [], success: [], error: [], finish: [] }),
  map(when(is(Function), of))
)

/* Merging hooks */
export const mergeHooks: Types.mergeHooks = curry((a, b) =>
  mergeWith(concat)(normalizeHooks(a), normalizeHooks(b))
)

/* Compose object of hooks */
export const mapComposeHooks: Types.mapComposeHooks = map(composeHooks)

/* Merge options objects */
export const mergeOptions: Types.mergeOptions = mergeDeepRight
