import apicase from './call'
import mergeOptions from './merge'

export default function apiService(opts) {
  this.opts = opts

  this.extend = function(newOpts) {
    return new apiService(mergeOptions(this.opts, newOpts))
  }

  this.call = function(reqOpts, meta) {
    return apicase(mergeOptions(this.opts, reqOpts), meta)
  }
}
