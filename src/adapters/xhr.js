// @flow
import { type Adapter } from '../types'
import { evaluateHeaders } from '../utils'
import { merge, forEachObjIndexed } from 'ramda'

type XHRAdapterQuery = {
  url?: string,
  params?: { [key: string]: string | number | null },
  query?: { [key: string]: string | number | null },
  data?: Object | FormData | string | void
}

const xhrAdapter: Adapter<XHRAdapterQuery> = ({ options, done, fail, another }) => {
  const opts = merge({ method: 'GET', body: undefined, headers: {} })(options)
  opts.headers = evaluateHeaders(opts.headers)
  const xhr = new XMLHttpRequest()
  xhr.open(opts.method, opts.url, true)
  // $FlowFixMe
  xhr.onload = (e) => done(JSON.parse(e.target.responseText))
  xhr.onerror = e => fail(e)
  xhr.onprogress = e => another('progress', e)
  xhr.onabort = e => another('aborted', e)
  forEachObjIndexed(opts.headers, (value, header) =>
    xhr.setRequestHeader(header, value)
  )
  xhr.send(opts.body)
}

export default xhrAdapter
