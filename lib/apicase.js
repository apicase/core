import { clone, merge, mapObjIndexed } from 'nanoutils'
import EventBus from 'nanoevents'
import { normalizeOptions } from './normalize'

function compose(hooks, createData) {
  return function(payload, changePayload) {
    if (!hooks.length) return Promise.resolve(payload)
    return new Promise(function(resolve) {
      var data = createData(payload)
      var merged = merge(data, {
        next: function(payload) {
          changePayload(payload)
          return compose(hooks.slice(1), createData)(
            payload,
            changePayload
          ).then(resolve)
        }
      })
      hooks[0](merged)
    })
  }
}

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
 * State of querty
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
export function apicase(adapter) {
  return function doRequest(req, opts) {
    // Prepare
    opts = opts || {}
    req = req._isNormalized ? req : normalizeOptions(req)

    // All data
    var bus = new EventBus()
    var res = {
      state: {
        success: false,
        pending: false,
        started: false,
        payload: req.payload,
        result: adapter.createState()
      },
      on: function(evt, cb) {
        bus.on(evt, cb)
        return res
      },
      cancel: function() {
        return Promise.resolve()
          .then(function() {
            return cancelCallback()
          })
          .then(function(res) {
            bus.emit('cancel', res.state)
          })
      }
    }
    var cancelCallback = function() {}

    /* TODO: reduce boilerplate for sets */
    function setState(change) {
      var prev = clone(res.state)
      var next = merge(prev, change)
      res.state = next
      bus.emit('change:state', {
        prev: prev,
        next: next,
        change: change
      })
    }

    function setPayload(change) {
      var prev = clone(res.state.payload)
      var next = merge(prev, change)
      res.state.payload = next
      bus.emit('change:payload', {
        prev: prev,
        next: next,
        change: change
      })
    }

    function setResult(change) {
      var prev = clone(res.state.result)
      var next = merge(prev, change)
      res.state.result = next
      bus.emit('change:result', {
        prev: prev,
        next: next,
        change: change
      })
    }

    function retry(payload) {
      return doRequest({
        payload: payload,
        meta: req.meta,
        hooks: {
          before: req.hooks.before,
          resolve: composedHooks.resolve,
          reject: composedHooks.reject
        }
      })
    }

    var hooks = {
      before: {
        state: { started: true, pending: true },
        update: setPayload,
        payload: function(payload) {
          return {
            payload: payload,
            resolve: composedHooks.resolve,
            reject: composedHooks.reject
          }
        },
        finalCb: callAdapter
      },
      resolve: {
        state: { success: true },
        update: setResult,
        payload: function(result) {
          return {
            retry: retry,
            result: result,
            reject: composedHooks.reject
          }
        },
        finalCb: function(result) {
          setState({ pending: false })
          bus.emit('resolve', result, res.state)
          bus.emit('finish', result, res.state)
        }
      },
      reject: {
        state: { success: true },
        update: setResult,
        payload: function(result) {
          return {
            retry: retry,
            result: result,
            resolve: composedHooks.resolve
          }
        },
        finalCb: function(result) {
          setState({ pending: false })
          bus.emit('resolve', result, res.state)
          bus.emit('finish', result, res.state)
        }
      }
    }

    var composedHooks = mapObjIndexed(function(params, k) {
      return function(payload) {
        setState(params.state)
        return compose(req.hooks[k], params.payload)(
          payload,
          params.update
        ).then(params.finalCb)
      }
    }, hooks)

    // Adapter + hooks
    var callAdapter = function(payload) {
      return new Promise(function(done) {
        adapter.callback({
          payload: res.state.payload,
          result: res.state.result,
          resolve: function(result) {
            composedHooks.resolve(result).then(function() {
              done(res.state)
            })
          },
          reject: function(res) {
            composedHooks.reject(result).then(function() {
              done(res.state)
            })
          },
          emit: bus.emit,
          setCancelCallback(cb) {
            cancelCallback = cb
          }
        })
      })
    }

    // Start queue and add to res
    res.promise = composedHooks.before(req.payload).catch(function(err) {
      bus.emit('error', err)
      return Promise.reject(err)
    })
    res.then = res.promise.then
    res.catch = res.promise.catch

    return res
  }
}
