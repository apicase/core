import apicase from './apicase'
import mergeOptions from './merge'

export default function ApiService(adapter, opts) {
  this._isApiService = true
  this.adapter = adapter
  this.opts = Array.isArray(opts) ? opts : [opts]

  this.extend = function(newOpts) {
    return new ApiService(adapter, this.opts.concat(newOpts))
  }

  this.call = function(opts) {
    return apicase(this.adapter)(
      mergeOptions(this.adapter, this.opts.concat(opts)),
      { disableNormalization: true }
    )
  }
}
