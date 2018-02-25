import { clone, merge, mapObjIndexed } from 'nanoutils'
import EventBus from 'nanoevents'
import { normalizeOptions } from './normalize'

const compose = (hooks, createData) => (payload, changePayload) =>
  new Promise(resolve => {
    if (!hooks.length) return resolve(payload)
    const data = createData(payload)
    const next = payload => {
      changePayload(payload)
      const callNextHooks = compose(hooks.slice(1), createData)
      return callNextHooks(payload, changePayload).then(resolve)
    }
    const merged = merge(data, { next })
    hooks[0](merged)
  })

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
  if (adapter.convert) {
    req.payload = adapter.convert(req.payload)
  }

  // All data
  const bus = new EventBus()
  const on = evt => cb => {
    bus.on(evt, cb)
    return res
  }
  const res = {
    state: {
      success: false,
      pending: false,
      started: false,
      cancelled: false,
      payload: req.payload,
      result: adapter.createState ? adapter.createState() : {}
    },
    on: (evt, cb) => on(evt)(cb),
    onDone: on('done'),
    onFail: on('fail'),
    off: (evt, cb) => {
      const idx = bus.events.indexOf(cb)
      if (idx !== -1) {
        bus.events[name].splice(idx, 1)
      }
      return res
    },
    start: () => {
      res.promise = composedHooks.before(req.payload)
      res.promise.catch(function(err) {
        bus.emit('error', err)
        return Promise.reject(err)
      })
      return res
    },
    cancel: () => {
      return Promise.resolve()
        .then(() => cancelCallback())
        .then(() => {
          setState({ success: false, pending: false, cancelled: true })
          bus.emit('cancel', res.state)
        })
    }
  }
  let cancelCallback = () => {}

  /* TODO: reduce boilerplate for sets */
  const setState = change => {
    const prev = clone(res.state)
    const next = merge(prev, change)
    res.state = next
    bus.emit('change:state', {
      prev: prev,
      next: next,
      change: change
    })
  }

  const setPayload = change => {
    const prev = clone(res.state.payload)
    const next = merge(prev, change)
    res.state.payload = next
    bus.emit('change:payload', {
      prev: prev,
      next: next,
      change: change
    })
  }

  const setResult = change => {
    const prev = clone(res.state.result)
    const next = merge(prev, change)
    res.state.result = next
    bus.emit('change:result', {
      prev: prev,
      next: next,
      change: change
    })
  }

  // Adapter + hooks
  const doRequest = function(payload) {
    return new Promise(resolve => {
      const doneCb = result =>
        setResult(result) ||
        composedHooks.done(res.state.result).then(() => resolve(res.state))

      const failCb = result =>
        setResult(result) ||
        composedHooks.fail(res.state.result).then(() => resolve(res.state))

      adapter.callback({
        payload: res.state.payload,
        result: res.state.result,
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
      payload: payload => ({
        payload: payload,
        done: composedHooks.done,
        fail: composedHooks.fail
      }),
      finalCb: doRequest
    },
    done: {
      state: { success: true },
      update: setResult,
      payload: result => ({
        retry: doRequest,
        result: result,
        fail: composedHooks.fail
      }),
      finalCb: result => {
        setState({ pending: false })
        bus.emit('done', result, res.state)
        bus.emit('finish', result, res.state)
      }
    },
    fail: {
      state: { success: false },
      update: setResult,
      payload: result => ({
        retry: doRequest,
        result: result,
        done: composedHooks.done
      }),
      finalCb: result => {
        setState({ pending: false })
        bus.emit('fail', result, res.state)
        bus.emit('finish', result, res.state)
      }
    }
  }

  // Object with callbacks that start hooks queue
  const composedHooks = mapObjIndexed(
    (params, k) => payload => {
      setState(params.state)
      if (res.state.cancelled) return res
      return compose(req.hooks[k], params.payload)(payload, params.update).then(
        params.finalCb
      )
    },
    hooks
  )

  res.promise = Promise.resolve(null)
  res.then = cb => res.promise.then(cb)
  res.catch = cb => res.promise.catch(cb)

  if (req.options.immediate === true || req.options.immediate === undefined) {
    res.start()
  }
  if (req.options.timer) {
    setTimeout(res.start, req.options.timer)
  }

  if (req.options.immediate !== false) {
    res.start()
  }

  return res
}

export { apicase }
