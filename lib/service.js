import apicase from './call'
import mergeOptions from './merge'

export default function apiService(opts) {
  var isNormalized = false

  this.extend = function(opts) {
    return new apiService(mergeOptions(this.opts, opts, meta))
  }

  this.call = function(req, meta) {
    meta = meta || {}
    meta.disableNormalize = true
    return apicase(mergeOptions(opts, req), meta)
  }
}
