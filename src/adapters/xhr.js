import { evaluateHeaders } from 'utils'
import { merge, forEachObjIndexed } from 'ramda'

export default function xhrAdapter ({ options, done, fail, another }) {
  const opts = merge({ method: 'GET', body: undefined, headers: {} })(options)
  opts.headers = evaluateHeaders(opts.headers)
  const xhr = new XMLHttpRequest()
  xhr.open(opts.method, opts.url, true)
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4) {
      return
    }
    if (xhr.status < 400) {
      done(JSON.parse(xhr.responseText))
    } else {
      fail(xhr)
    }
  }
  xhr.onprogress = e => another('progress', e)
  forEachObjIndexed(opts.headers, (value, header) =>
    xhr.setRequestHeader(header, value)
  )
  xhr.send(opts.body)
}
