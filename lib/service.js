import apicase from './call'
import mergeOptions from './merge'

export default function ApiService(opts) {
  this.opts = Array.isArray(opts) ? opts : [opts]

  this.extend = function(newOpts) {
    return new ApiService(this.opts.concat(newOpts))
  }

  this.call = function(reqOpts, meta) {
    return apicase(mergeOptions(this.opts.concat(reqOpts)), meta)
  }
}
