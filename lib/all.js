import apiCall from './call'

export default function apiAll(opts) {
  return Promise.all(
    opts.map(function(o) {
      return apiCall(o)
    })
  )
}
