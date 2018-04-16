import NanoEvents from 'nanoevents'
import { mergeOptions } from './merge'

const noAutoStart = opts =>
  mergeOptions(null, [opts, { options: { immediate: false } }])

/**
 * Create a queue of requests
 * @param {Object} [options={ immediate: true }] Object with options
 * @param {boolean} options.immediate options.immediate Start queue automatically
 */
export function ApiQueue(options) {
  options = Object.assign({ immediate: true }, options || {})
  this.queue = []
  this.current = null
  const bus = new NanoEvents()

  /**
   * Push request to queue
   * @param {Function} callback Callback for request
   * @param {Object} payload Request payload
   * @param {Object} opts Request options (meta, hooks, etc)
   * @returns {Request} Created request
   */
  this.push = function(callback, payload, opts) {
    opts =
      typeof payload === 'function' ? opts : Object.assign({}, payload, opts)

    /* Push to queue with forced immediate: false */
    const request = callback(noAutoStart(opts))
    this.queue.push(request)

    /* Emit `done` event if it's last done request */
    request.on('done', (res, state) => {
      if (this.queue.indexOf(request) === this.queue.length - 1) {
        bus.emit('done', res, state)
      }
    })

    /* Emit `fail` event when some of requests are failed */
    request.on('fail', (res, state) => {
      bus.emit('fail', res, state)
    })

    /* Remove req from queue */
    request.on('finish', () => this.remove(request))
    request.on('cancel', () => {
      this.queue = []
      bus.emit('cancel')
    })

    /* Start automatically when { immediate: true } */
    if (this.queue.length === 1) {
      if (options.immediate) {
        this.queue[0].start()
      }
    } else {
      /* Start last request on pre-last is done */
      const lastIdx = this.queue.length - 1
      const preLast = this.queue[lastIdx - 1]

      preLast.on('done', result => {
        if (this.queue[lastIdx]) {
          this.queue[lastIdx].start(
            typeof payload === 'function' ? payload(result) : payload
          )
        }
      })
    }

    return request
  }

  /**
   * Remove single request from queue
   * @param {Request} request Request to remove
   * @returns {this} Queue instance
   */
  this.remove = function(request) {
    const idx = this.queue.indexOf(request)
    if (idx === -1) {
      return this
    }
    if (request === this.current) {
      request.clear()
    }
    this.queue.splice(idx, 1)
    return this
  }

  /**
   * Cancel current queue and clear queue (by `cancel` event)
   * @returns {this} Queue instance
   */
  this.clear = function() {
    this.current.cancel()
    return this
  }

  /**
   * Listen to queue events
   * @param {string} evt Event name
   * @param {Function} cb Event callback
   * @returns {this} Queue instance
   */
  this.on = function(evt, cb) {
    bus.on(evt, cb)
    return this
  }

  /**
   * Remove event listener
   * @param {string} evt Event name
   * @param {Function} cb Event callback
   * @returns {this} Queue instance
   */
  this.off = function(evt, cb) {
    if (!bus.events[evt]) return this
    const idx = bus.events.indexOf(cb)
    if (idx !== -1) {
      bus.events[name].splice(idx, 1)
    }
    return this
  }
}
