import { pick, clone, merge, map, mapObjIndexed } from 'nanoutils'
import EventBus from 'nanoevents'
import normalizeOptions from './normalize'

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

function apicase(adapter) {
  return function(req, opts) {
    // Prepare
    opts = opts || {}
    req = opts.disableNormalize ? req : normalizeOptions(adapter, req)

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

    var payloads = {
      before: function(payload) {
        return {
          payload: payload,
          resolve: resolve,
          reject: reject
        }
      },
      resolve: function(result) {
        return {
          result: result,
          reject: reject
        }
      },
      reject: function(result) {
        return {
          result: result,
          resolve: resolve
        }
      }
    }

    var composedHooks = mapObjIndexed(function(v, k) {
      return compose(req.hooks[k], payloads[k])
    }, payloads)

    function resolve(result) {
      return composedHooks.resolve(result, setResult).then(function(result) {
        bus.emit('resolve', result, res.state)
      })
    }

    function reject(result) {
      return composedHooks.reject(result, setResult).then(function(result) {
        bus.emit('reject', result, res.state)
      })
    }

    // Adapter + hooks
    var callAdapter = function(payload) {
      return new Promise(function(done) {
        adapter.callback({
          payload: res.state.payload,
          resolve: function(result) {
            resolve(result).then(function() {
              done(res.state)
            })
          },
          reject: function(res) {
            reject(result).then(function() {
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
    res.promise = composedHooks
      .before(req.payload, setPayload)
      .then(callAdapter)

    return res
  }
}

// var adapter = {
//   createState: () => ({
//     body: 'test'
//   }),

//   callback({ payload, resolve }) {
//     setTimeout(resolve, 200, payload)
//   }
// }

// var call = apicase(adapter)({
//   a: 123,
//   hooks: {
//     before: [
//       ({ payload, next }) =>
//         console.log('1', payload) ||
//         next(payload).then(i => console.log('never')),
//       ({ payload, reject }) =>
//         console.log('2', payload) ||
//         reject(payload).then(i => console.log('asdfasdf')),
//       ({ payload, next }) =>
//         console.log('never', payload) ||
//         next(payload).then(i => console.log('asdfasdf'))
//     ],
//     reject: [
//       ({ result, next }) =>
//         console.log('3', result) ||
//         next(result).then(i => console.log('asdfasdf')),
//       ({ result, resolve }) =>
//         console.log('4', result) ||
//         resolve(result).then(i => console.log('asdfasdf'))
//     ],
//     resolve: [
//       ({ result, next }) =>
//         console.log('5') || next(result).then(i => console.log('7')),
//       ({ result, next }) => console.log('6') || next(result)
//     ]
//   }
// })
