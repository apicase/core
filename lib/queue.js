import apicase from './call'

export default function apiQueue(optsArray, prev) {
  return !optsArray.length
    ? Promise.resolve(prev)
    : apicase(
        typeof optsArray[0] === 'function' ? optsArray[0](prev) : optsArray[0]
      ).then(function(res) {
        return apiQueue(optsArray.slice(1), res)
      })
}
