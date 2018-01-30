import apicase from './call'
import mergeOptions from './merge'

export default function ApiService(opts) {
  this.opts = opts

  this.extend = function(newOpts) {
    return new ApiService(mergeOptions(this.opts, newOpts))
  }

  this.call = function(reqOpts, meta) {
    return apicase(mergeOptions(this.opts, reqOpts), meta)
  }
}
