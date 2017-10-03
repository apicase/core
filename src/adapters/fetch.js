import { compile } from 'path-to-regexp'
import { pipeM, overAll, evaluateHeaders, jsonToQueryString } from 'utils'
import { map, over, pipe, view, merge, concat, converge, lensProp } from 'ramda'

const [urlLens, queryLens, paramsLens, headersLens] = map(lensProp)(['url', 'query', 'params', 'headers'])

const [getUrl, getQuery, getParams] = map(view)([urlLens, queryLens, paramsLens])

const [updateUrl, updateHeaders] = [overAll(urlLens), over(headersLens)]

// Shortcuts
// TODO: Uncurry not working with path-to-regexp.compile. Need to test and fix
const insertParams = converge((url, params) => compile(url)(params), [getUrl, getParams])

const insertQueryString = converge(concat, [getUrl, pipe(getQuery, jsonToQueryString)])

// IDEA: Add query options to done and fail callbacks
const goFetch = (done, fail) => ({ url, parser, ...options}) =>
  fetch(url, options)
    .then(r => r[parser]())
    .then(done)
    .catch(fail)


const setFetchDefaults = merge({ method: 'GET', body: undefined, headers: {}, parser: 'json', credentials: 'omit' })

// Combine all the above
export default function fetchAdapter ({ options, done, fail }) {
  return pipeM(
    // pickFetchParams,
    setFetchDefaults,
    updateUrl(insertParams),
    updateUrl(insertQueryString),
    updateHeaders(evaluateHeaders),
    goFetch(done, fail)
  )(options)
}
