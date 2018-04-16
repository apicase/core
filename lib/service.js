import { apicase } from './apicase'
import { clone, equals } from 'nanoutils'
import { mergeOptions } from './merge'
import { normalizeOptions } from './normalize'

/**
 * Create a new service
 * @param {Object} options Object with partial passed hooks, payload and meta info
 * @param {Object} options.adapter Object Adapter object
 * @param {Object} options.meta Object with meta information
 * @param {Object} options.hooks Object with hooks
 */
export function ApiService(opts) {
  if (arguments.length === 2) {
    console.warn(
      `[Apicase.deprecated] Apicase Service now should be defined as "new ApiService({ adapter, ...opts })" instead of "new ApiService(adapter, opts)"`
    )
    opts[1].opts.adapter = opts[0]
    return new ApiService(opts[1])
  }
  this._isApiService = true
  this._opts = (Array.isArray(opts) ? opts : [opts]).map(opt =>
    normalizeOptions(opt)
  )
  this._listeners = {}
  this.queue = []

  const addCall = payload => {
    const call = apicase(payload.adapter)(payload).on('finish', () => {
      this.queue.splice(this.queue.indexOf(call), 1)
    })
    Object.entries(this._listeners).forEach(([evt, cbs]) => {
      cbs.forEach(cb => {
        call.on(evt, cb)
      })
    })
    this.queue.push(call)
    return call
  }

  const getOpts = opts => mergeOptions(this._opts.concat(opts))

  /**
   * Modifies service instance
   * @param {Function} callback Callback that accepts service and modifies it
   */
  this.use = function(cb) {
    return cb(this.extend())
  }

  /**
   * Create global listeners
   * @param {String} event Event name
   * @param {Function} callback Callback
   */
  this.on = function(evt, cb) {
    this._listeners[evt] = (this._listeners[evt] || []).concat(cb)
    return this
  }

  /**
   * Remove global listeners
   * @param {String} event Event name
   * @param {Function} callback Callback
   */
  this.off = function(evt, cb) {
    if (!this._listeners[evt]) return this
    const idx = this._listeners[evt].indexOf(cb)
    if (idx > -1) this._listeners[evt].splice(idx, 1)
    return this
  }

  /**
   * Create a new extended service
   * @param {Object} options Options object to merge with service options
   */
  this.extend = function(newOpts) {
    const service = new ApiService(this._opts.concat(newOpts))
    service._listeners = clone(this._listeners)
    return service
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
          this.queue[this.queue.length - 1]
            .on('finish', () => next(payload))
            .on('cancel', () => next(payload))
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
    const idx = this.queue.findIndex(i => equals(i.payload, req.payload))
    return idx > -1 ? this.queue[idx] : addCall(req)
  }
}
