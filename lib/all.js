import { apiCall } from './call'

/*
  TODO: Rework this
  Should have .on callback too
*/
export function apiAll(opts) {
  return Promise.all(
    opts.map(function(o) {
      return apiCall(o)
    })
  )
}
