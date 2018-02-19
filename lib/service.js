import { apicase } from './apicase'
import { mergeOptions } from './merge'
import { equals } from 'nanoutils'

/**
 * Create a new service
 * @param {Adapter} adapter Object with adapter
 * @param {Object} options Object with partial passed hooks, payload and meta info
 * @param {Object} options.meta Object with meta information
 * @param {Object} options.hooks Object with hooks
 */
export function ApiService(adapter, opts) {
  this._isApiService = true
  this._opts = Array.isArray(opts) ? opts : [opts]
  this.adapter = adapter
  this.queue = []

  function addCall(payload) {
    var call = apicase(this.adapter)(payload).on('finish', function() {
      this.queue.splice(this.queue.indexOf(call), 1)
    })
    this.queue.push(call)
    return call
  }

  /**
   * Create a new extended service
   * @param {Object} options Options object to merge with service options
   */
  this.extend = function(newOpts) {
    return new ApiService(adapter, this._opts.concat(newOpts))
  }

  /**
   * Do service request
   * @param {Object} options Options object to merge with service options
   */
  this.doRequest = function(opts) {
    return addCall(mergeOptions(this.adapter, this._opts.concat(opts)))
  }

  /**
   * Create service request that will be called after the last request is done
   * @param {Object} options Options object to merge  with service options
   */
  this.pushRequest = function(opts) {
    var s = this
    if (this.queue.length > 0) {
      this.queue[this.queue.length - 1].on('finish', function() {
        return s.doRequest(opts)
      })
    }
  }

  /**
   * Creates a request unless queue is empty.
   * Otherwise, returns the first request of the queue
   * @param {Object} options Options object to merge with service options
   */
  this.doSingleRequest = function(opts) {
    return this.queue[0] ? this.queue[0] : this.doRequest(opts)
  }

  /**
   * Creates a request unless queue has the same request
   * Otherwise, returns this request
   * @param {Object} options Options object to merge with service options
   */
  this.doUniqueRequest = function(opts) {
    var req = mergeOptions(this.adapter, this._opts.concat(opts))
    var idx = -1
    for (var i in this.queue) {
      if (equals(this.queue[i].state.payload, req.payload)) {
        idx = i
        break
      }
    }
    return idx > -1 ? this.queue[idx] : addCall(req)
  }
}
