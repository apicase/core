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
    res.promise = composedHooks.before(req.payload)

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
//         next(payload).then(i => console.log('never 1')),

//       ({ payload, reject }) =>
//         console.log('2', payload) ||
//         reject(payload).then(i => console.log('never 2')),

//       ({ payload, next }) =>
//         console.log('never 3', payload) ||
//         next(payload).then(i => console.log('never 4'))
//     ],
//     reject: [
//       ({ result, next }) =>
//         console.log('3', result) ||
//         next(result).then(i => console.log('never 5')),

//       ({ result, resolve }) =>
//         console.log('4', result) ||
//         resolve(result).then(i => console.log('8', result))
//     ],
//     resolve: [
//       ({ result, next }) =>
//         console.log('5', result) ||
//         next(result).then(i => console.log('7', result)),

//       ({ result, next }) => console.log('6', result) || next(result)
//     ]
//   }
// }).on('resolve', res => console.log('Success', res))

// const getPosts = withToken.extend({
//   url: 'posts'
// })

// const authBus = new EventBus()

// const authService = new ApiService({
//   url: '/api/getToken'
// })

// if (authService.queue[0]) {
//   authService.queue[0].on('resolve', retry)
// } else {
//   authService.call().on('resolve', retry)
// }
