import apicase from './call'

export default function callQueue(optsArray, prev) {
  return !optsArray.length
    ? prev
    : apicase(
        typeof optsArray[0] === 'function' ? optsArray[0](prev) : optsArray[0]
      ).then(function(res) {
        return callQueue(optsArray.slice(1), res)
      })
}

apicase.addServices({
  resolve: {
    callback: (payload, { resolve }) => resolve(payload)
  }
})

callQueue([
  { adapter: 'resolve', payload: 1 },
  { adapter: 'resolve', payload: 2 },
  prev => ({ adapter: 'resolve', payload: prev + 4 })
]).then(console.log)
