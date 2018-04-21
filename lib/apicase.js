import EventBus from 'nanoevents'
import { pick, merge } from 'nanoutils'
import { normalizeOptions } from './normalize'

const composeHooks = function composeHooks(options, debugStack = []) {
  let idx = 0
  return function withPayload(payload) {
    options.before()

    if (!options.hooks[idx]) {
      options.update(payload)
      return Promise.resolve().then(() => options.final(payload, debugStack))
    }

    const promise = new Promise(resolve => {
      let isResolved = false

      const tryResolve = ctx => {
        if (process.env.NODE_ENV !== 'production' && isResolved) {
          console.error(
            `[Apicase: hooks] Attempt to resolve ${
              options.type
            }[${idx}] hook twice:`
          )
          return
        }
        isResolved = true
        resolve(ctx)
        return ctx
      }

      const opts = options.createContext(payload, {
        changeFlow: nextOptions => payload =>
          tryResolve(composeHooks(nextOptions, debugStack)(payload))
      })
      opts.next = next => {
        options.update(next)
        idx++
        return tryResolve(withPayload(next))
      }
      try {
        debugStack.push([options.type, idx, opts.payload, opts.result])
        options.hooks[idx](opts)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          const text = `[Apicase] Error in ${options.type}[${idx}] hook:`
          console.groupCollapsed(text)
          console.log(
            'Call stack:',
            debugStack.map(item => `${item[0]}[${item[1]}]`).join(' -> ')
          )
          console.error('Error', err)
          console.groupEnd(text)
        }
        options.handleError({
          idx: idx,
          type: options.type,
          hooks: options.hooks,
          stack: debugStack,
          error: err
        })
        throw err
      }
    })
    return promise
  }
}

const pickState = pick([
  'success',
  'pending',
  'started',
  'cancelled',
  'payload',
  'result',
  'meta'
])

/**
 * Function that starts request
 *
 * @function doRequest
 * @param {Object} request Object with payload, hooks and meta info
 * @returns {Request} Thenable object with state, .on() and .cancel() methods
 */

/**
 * @typedef {Object} Request
 * @property {State} state State of request
 * @property {EventHandler} on Subscrube to request events
 * @property {CancelRequest} cancel Cancel request
 */

/**
 * State of query
 *
 * @typedef {Object} State
 * @property {boolean} success Sets to true when request is resolved
 * @property {boolean} pending true until request is finished
 * @property {started} started like `pending` but doesn't become false after request finish
 * @property {Object} payload Request payload
 * @property {Result} result Adapter state
 */

/**
 * Subscribe to request events
 *
 * @callback EventHandler
 * @param {string} type Event type
 * @param {Function} callback Event handler
 */

/**
 * Cancel request
 *
 * @callback CancelRequest
 */

/**
 * Adapter object
 *
 * @typedef {Object} Adapter
 * @property {Function} createState Creates adapter state
 * @property {Function} callback Contains adapter logic
 * @property {Function} merge Contains merge strategies
 * @property {Function} convert Is applied to request payload before request
 */

/**
 * Create a request callback with choosed adapter
 *
 * @param {Adapter} adapter Adapter instance
 * @returns {doRequest} Callback that starts request
 */
const apicase = adapter => req => {
  req.adapter = adapter
  // Prepare
  req = req._isNormalized ? req : normalizeOptions(req)

  // All data
  let timer = null
  const bus = new EventBus()
  const start = payload => {
    bus.emit('start', pickState(res))
    res.promise = composeHooks(before, debugStack)(payload)
    res.then = cb => res.promise.then(cb)
    res.catch = cb => res.promise.catch(cb)
  }
  const res = {
    meta: req.meta,
    success: false,
    pending: false,
    started: false,
    cancelled: false,
    payload: null,
    result: null,
    on: (evt, cb) => {
      bus.on(evt, cb)
      return res
    },
    onDone: cb => {
      bus.on('done', cb)
      return res
    },
    onFail: cb => {
      bus.on('fail', cb)
      return res
    },
    off: (evt, cb) => {
      if (!bus.events[evt]) return res
      const idx = bus.events[evt].indexOf(cb)
      if (idx !== -1) {
        bus.events[name].splice(idx, 1)
      }
      return res
    },
    /* TODO: refactor .start() method */
    start() {
      if (req.options.once ? req.started : req.pending) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            req.options.once
              ? '[Apicase: req.start()] Trying to start request with { once: false } a second time'
              : '[Apicase: req.start()] Attempt to start an already running query',
            res
          )
        }
        return res
      }

      const payload = arguments.length ? arguments[0] : req.payload
      const timeout = req.options.debounce || req.options.delay
      res.payload = payload
      res.result = adapter.createState ? adapter.createState() : {}

      if (req.options.debounce) clearTimeout(timer)

      if (timeout) {
        timer = setTimeout(start, timeout, req.payload)
      } else {
        start(req.payload)
      }

      if (req.options.timeout) {
        setTimeout(() => {
          if (res.pending) res.cancel()
        }, req.options.timeout)
      }

      return res
    },
    cancel: () => {
      return Promise.resolve(cancelCallback()).then(() => {
        setState({ success: false, pending: false, cancelled: true })
        bus.emit('cancel', pickState(res))
      })
    }
  }
  let cancelCallback = () => {}

  const setState = diff => {
    const prev = pickState(res)
    const next = merge(prev, diff)
    bus.emit('change:state', {
      prev: prev,
      next: next,
      diff: diff
    })
    Object.assign(res, next)
  }

  const setResult = next => {
    const prev = res.result
    bus.emit('change:result', {
      prev: prev,
      next: next
    })
    res.result = next
  }

  let debugStack = []
  const handleError = ctx => {
    bus.emit('error', ctx)
    debugStack = ctx.stack
  }

  // Adapter + hooks
  const doRequest = function(payload) {
    return new Promise(resolve => {
      const doneCb = result => {
        setResult(result)
        composeHooks(done, debugStack)(result).then(() =>
          resolve(pickState(res))
        )
      }

      const failCb = result => {
        setResult(result)
        composeHooks(fail, debugStack)(result).then(() =>
          resolve(pickState(res))
        )
      }

      adapter.callback({
        payload: adapter.convert ? adapter.convert(res.payload) : res.payload,
        result: res.result,
        setResult: setResult,
        resolve: doneCb,
        reject: failCb,
        emit: bus.emit,
        setCancelCallback: cb => {
          cancelCallback = cb
        }
      })
    })
  }

  const [before, done, fail] = [
    {
      type: 'before',
      hooks: req.hooks.before,
      before() {
        setState({ pending: true, started: true })
      },
      handleError: handleError,
      update(diff) {
        if (process.env.NODE_ENV !== 'production') {
          if (typeof diff !== 'object' || Array.isArray(diff)) {
            throw new Error(
              `[Apicase] Payload should be an object, ${typeof diff} given`
            )
          }
        }
        const prev = res.payload
        const next = merge(prev, diff)
        bus.emit('change:payload', {
          prev: prev,
          next: next,
          diff: diff
        })
        res.payload = next
      },
      createContext: (payload, { changeFlow }) => ({
        meta: req.meta,
        payload: payload,
        done: changeFlow(done),
        fail: changeFlow(fail)
      }),
      final(result, stack) {
        debugStack = stack
        return doRequest(result)
      }
    },
    {
      type: 'done',
      hooks: req.hooks.done,
      before() {
        setState({ pending: false, success: true })
      },
      update: setResult,
      handleError: handleError,
      createContext: (result, { changeFlow }) => ({
        meta: req.meta,
        payload: res.payload,
        result: result,
        fail: changeFlow(fail)
      }),
      final(result, stack) {
        debugStack = stack
        setState({ pending: false })
        setResult(result)
        bus.emit('done', result, pickState(res))
        bus.emit('finish', result, pickState(res))
        return pickState(res)
      }
    },
    {
      type: 'fail',
      hooks: req.hooks.fail,
      before() {
        setState({ pending: false, success: false })
      },
      update: setResult,
      handleError: handleError,
      createContext: (result, { changeFlow }) => ({
        meta: req.meta,
        payload: res.payload,
        result: result,
        retry: changeFlow(before),
        done: changeFlow(done)
      }),
      final(result, stack) {
        debugStack = stack
        setState({ pending: false })
        setResult(result)
        bus.emit('fail', result, pickState(res))
        bus.emit('finish', result, pickState(res))
        return pickState(res)
      }
    }
  ]

  res.promise = Promise.resolve(null)
  res.then = cb => res.promise.then(cb)
  res.catch = cb => res.promise.catch(cb)

  if (req.options.immediate) {
    res.start()
  }

  return res
}

export { apicase }
