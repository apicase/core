import { apiCall } from './call'

/*
  TODO: Rework this
  Should have .on callback too
*/
export function apiQueue(optsArray, prev) {
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
  return apiCall(opt).then(function(res) {
    return apiQueue(optsArray.slice(1), res)
  })
}
