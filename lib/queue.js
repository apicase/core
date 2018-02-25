import NanoEvents from 'nanoevents'
import { mergeOptions } from './merge'

/**
 * Create a queue of requests
 * @param {Object} [options={ immediate: true }] Object with options
 * @param {boolean} options.immediate options.immediate Start queue automatically
 */
export function ApiQueue(opts) {
  opts = Object.assign({ immediate: true }, opts)
  this.queue = []
  const bus = new NanoEvents()

  this.push = function(cb, opts) {
    const request = cb(
      mergeOptions(null, [opts, { options: { immediate: false, timer: null } }])
    )

    this.queue.push(request)
    request.on('done', (res, state) => {
      if (this.queue.indexOf(request) === this.queue.length - 1) {
        bus.emit('done', res, state)
      }
    })
    request.on('fail', (res, state) => {
      bus.emit('fail', res, state)
    })
    request.on('finish', () => this.remove(request))
    request.on('cancel', () => this.remove(request))

    if (this.queue.length === 1) {
      if (opts.immediate) {
        this.queue[0].start()
      }
    } else {
      const preLast = this.queue[this.queue.length - 2]

      preLast.on('done', () => {
        const idx = this.queue.indexOf(preLast) + 1
        if (this.queue[idx]) {
          this.queue[idx].start()
        }
      })
    }

    return request
  }

  this.remove = function(request) {
    this.queue.splice(this.queue.indexOf(request), 1)
    if (!this.queue.length) {
      bus.emit('finish')
    }
  }

  this.on = function(evt, cb) {
    bus.on(evt, cb)
    return this
  }

  this.off = function(evt, cb) {
    const idx = bus.events.indexOf(cb)
    if (idx !== -1) {
      bus.events[name].splice(idx, 1)
    }
    return this
  }
}
