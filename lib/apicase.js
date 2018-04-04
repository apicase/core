import { pick, merge, mapObjIndexed } from 'nanoutils'
import EventBus from 'nanoevents'
import normalizeOptions from './normalize'

function CHANGE_CALLBACK(cb) {
  this.callback = cb
}

const compose = (hooks, createData) => (payload, changePayload) =>
  new Promise((resolve, reject) => {
    if (!hooks.length) return resolve(payload)
    const data = createData(payload, cb => reject(new CHANGE_CALLBACK(cb)))
    const next = payload => {
      changePayload(payload)
      const callNextHooks = compose(hooks.slice(1), createData)
      callNextHooks(payload, changePayload)
        .then(resolve)
        .catch(reject)
    }
    const merged = merge(data, { next })
    hooks[0](merged)
  })

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
const apicase = adapter => (req, opts) => {
  // Prepare
  opts = opts || {}
  req = req._isNormalized ? req : normalizeOptions(adapter, req)

  // All data
  let timer = null
  const bus = new EventBus()
  const on = evt => cb => {
    bus.on(evt, cb)
    return res
  }
  const start = payload => {
    res.started = true
    bus.emit('start', getState())
    res.promise = composedHooks.before(payload).catch(err => {
      if (err instanceof CHANGE_CALLBACK) {
        return err.callback()
      } else {
        bus.emit('error', err)
        return Promise.reject(err)
      }
    })
    res.then = cb => res.promise.then(cb)
    res.catch = cb => res.promise.catch(cb)
  }
  const getState = () => pickState(res)
  const res = {
    meta: req.meta,
    success: false,
    pending: false,
    started: false,
    cancelled: false,
    payload: null,
    result: null,
    on: (evt, cb) => on(evt)(cb),
    onDone: on('done'),
    onFail: on('fail'),
    off: (evt, cb) => {
      if (!bus.events[evt]) return res
      const idx = bus.events[evt].indexOf(cb)
      if (idx !== -1) {
        bus.events[name].splice(idx, 1)
      }
      return res
    },
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
      return Promise.resolve()
        .then(() => cancelCallback())
        .then(() => {
          setState({ success: false, pending: false, cancelled: true })
          bus.emit('cancel', getState())
        })
    }
  }
  let cancelCallback = () => {}

  /* TODO: reduce boilerplate for sets */
  const setState = diff => {
    const prev = getState()
    const next = merge(prev, diff)
    bus.emit('change:state', {
      prev: prev,
      next: next,
      diff: diff
    })
    Object.assign(res, next)
  }

  const setPayload = diff => {
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
  }

  const setResult = next => {
    const prev = res.result
    bus.emit('change:result', {
      prev: prev,
      next: next
    })
    res.result = next
  }

  // Adapter + hooks
  const doRequest = function(payload) {
    return new Promise(resolve => {
      const doneCb = result =>
        setResult(result) ||
        composedHooks.done(res.result).then(() => resolve(getState()))

      const failCb = result =>
        setResult(result) ||
        composedHooks.fail(res.result).then(() => resolve(getState()))

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

  // Options for hooks queues
  const hooks = {
    before: {
      state: { started: true, pending: true },
      update: setPayload,
      payload: (payload, changeFlow) => ({
        meta: req.meta,
        payload: payload,
        done: res => changeFlow(() => composedHooks.done(res)),
        fail: res => changeFlow(() => composedHooks.fail(res))
      }),
      finalCb: doRequest
    },
    done: {
      state: { success: true },
      update: setResult,
      payload: (result, changeFlow) => ({
        meta: req.meta,
        retry: res => changeFlow(() => doRequest(res)),
        payload: res.payload,
        result: result,
        fail: res => changeFlow(() => composedHooks.fail(res))
      }),
      finalCb: result => {
        setState({ pending: false })
        bus.emit('done', result, getState())
        bus.emit('finish', result, getState())
        return getState()
      }
    },
    fail: {
      state: { success: false },
      update: setResult,
      payload: (result, changeFlow) => ({
        meta: req.meta,
        retry: doRequest,
        payload: res.payload,
        result: result,
        done: res => changeFlow(() => composedHooks.done(res))
      }),
      finalCb: result => {
        setState({ pending: false })
        setResult(result)
        bus.emit('fail', result, getState())
        bus.emit('finish', result, getState())
        return getState()
      }

      // Object with callbacks that start hooks queue
    }
  }
  const composedHooks = mapObjIndexed(
    (params, k) => payload => {
      setState(params.state)
      if (res.cancelled) return res
      return compose(req.hooks[k], params.payload)(payload, params.update)
        .then(params.finalCb)
        .catch(result => {
          if (result instanceof CHANGE_CALLBACK) {
            return result.callback()
          } else {
            return Promise.reject(result)
          }
        })
    },
    hooks
  )

  res.promise = Promise.resolve(null)
  res.then = cb => res.promise.then(cb)
  res.catch = cb => res.promise.catch(cb)

  if (req.options.immediate) {
    res.start()
  }

  return res
}

export { apicase }
