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

  const addCall = payload => {
    const call = apicase(this.adapter)(payload).on('finish', () =>не {
      this.queue.splice(this.queue.indexOf(call), 1)
    })
    this.queue.push(call)
    return call
  }

  const getOpts = opts => mergeOptions(this.adapter, this._opts.concat(opts))

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
    return addCall(getOpts(opts))
  }

  /**
   * Create service request that will be called after the last request is done
   * @param {Object} options Options object to merge  with service options
   */
  this.pushRequest = function(opts) {
    if (!this.queue.length) return addCall(opts)
    const withHook = {
      hooks: {
        before: ({ payload, next }) => {
          this.queue[this.queue.length - 1].on('finish', () => next(payload))
        }
      }
    }
    const mergedOpts = mergeOptions(withHook, opts)
    return addCall(getOpts(mergedOpts))
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
    const req = getOpts(opts)
    const idx = this.queue.findIndex(i => equals(i.state.payload, req.payload))
    return idx > -1 ? this.queue[idx] : addCall(req)
  }
}
