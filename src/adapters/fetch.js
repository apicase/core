// @flow
import type { Adapter } from '../types'
import { compile } from 'path-to-regexp'
import { pipeM, overAll, evaluateHeaders, jsonToQueryString } from '../utils'
import { over, pipe, prop, merge, concat, converge, lensProp } from 'ramda'

type FetchAdapterQuery = {
  url?: string,
  parser?: 'json' | 'blob' | 'text' | 'formData' | 'arrayBuffer',
  params?: { [key: string]: string | number | null },
  query?: { [key: string]: string | number | null },
  data?: Object | FormData | string | void,
  credentials?: 'omit' | 'same-origin' | 'include',
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached'
}

const urlLens = lensProp('url')
const headersLens = lensProp('headers')

// Shortcuts
// TODO: Uncurry not working with path-to-regexp.compile. Need to test and fix
const insertParams = converge(
  (url, params) => compile(url)(params),
  [prop('url'), prop('params')]
)

const insertQueryString = converge(concat, [prop('url'), pipe(prop('query'), jsonToQueryString)])

// IDEA: Add query options to done and fail callbacks
const goFetch = (done, fail) => ({ url, parser, ...options}) =>
  fetch(url, options)
    .then(async r =>
      r.ok
        // I'm sure that Response has parser of needed type
        // $FlowFixMe
        ? done(await r[parser]())
        : fail(r)
    )
    .catch(fail)


const setFetchDefaults = merge({ method: 'GET', body: undefined, headers: {}, parser: 'json', credentials: 'omit', cache: 'default' })

// Combine all the above
const fetchAdapter: Adapter<FetchAdapterQuery> = ({ options, done, fail }) => {
  pipeM(
    setFetchDefaults,
    overAll(urlLens)(insertParams),
    overAll(urlLens)(insertQueryString),
    over(headersLens)(evaluateHeaders),
    goFetch(done, fail)
  )(options)
}

export default fetchAdapter
