import apicase from './call'
import { omit } from './utils'

export default function apiQueue(optsArray, prev) {
  if (!optsArray.length) return Promise.resolve(prev)
  var opt =
    typeof optsArray[0] === 'function' ? optsArray[0](prev) : optsArray[0]
  if (process.env.NODE_ENV !== 'production') {
    if (typeof opt !== 'object') {
      throw new TypeError(
        '[apicase.apiQueue] Expected options to be an Object but some of them are not'
      )
    }
  }
  return (opt._isApiService
    ? opt.call(prev)
    : apicase(opt.adapter)(omit(['adapter'], opt))
  ).then(function(res) {
    return apiQueue(optsArray.slice(1), res)
  })
}
