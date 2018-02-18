import apicase from './apicase'
import mergeOptions from './merge'
import { equals } from 'nanoutils'

export default function ApiService(adapter, opts) {
  this._isApiService = true
  this.adapter = adapter
  this.opts = Array.isArray(opts) ? opts : [opts]
  this.queue = []

  function createCall(payload) {
    var call = apicase(this.adapter)(payload).on('finish', function() {
      this.queue.splice(this.queue.indexOf(call), 1)
    })
    this.queue.push(call)
    return call
  }

  this.extend = function(newOpts) {
    return new ApiService(adapter, this.opts.concat(newOpts))
  }

  this.call = function(opts) {
    return createCall(mergeOptions(this.adapter, this.opts.concat(opts)))
  }

  this.push = function(opts) {
    var s = this
    if (this.queue.length > 0) {
      this.queue[this.queue.length - 1].on('finish', function() {
        return s.call(opts)
      })
    }
  }

  this.single = function(opts) {
    return this.queue[0] ? this.queue[0] : this.call(opts)
  }

  this.unique = function(opts) {
    var req = mergeOptions(this.adapter, this.opts.concat(opts))
    var idx = -1
    for (var i in this.queue) {
      if (equals(this.queue[i].state.payload, req.payload)) {
        idx = i
        break
      }
    }
    return idx > -1 ? this.queue[idx] : createCall(req)
  }
}
