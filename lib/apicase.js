import { pick, clone } from 'nanoutils'
import EventBus from 'nanoevents'
import normalizeOptions from './normalize'

var states = {
  next: 'next',
  resolve: 'resolve',
  reject: 'reject'
}

function setStatus(name, acceptOpts) {
  return function(payload, opts) {
    var res = {
      status: states[name],
      payload: payload
    }
    return res
  }
}

function callHooks(hooks, opts) {
  return !hooks.length
    ? Promise.resolve({ status: 'next', payload: opts.payload })
    : Promise.resolve(opts)
        .then(function(opts) {
          return hooks[0](opts)
        })
        .then(function(res) {
          opts = clone(opts)
          opts.payload = res.payload
          return res.status === 'next' ? callHooks(hooks.slice(1), opts) : res
        })
}

function callFinalHooks(res) {
  const opts = {
    payload: res.payload,
    next: setStatus('next')
  }
  switch (res.status) {
    case 'resolve':
      opts.reject = setStatus('reject')
      break
    case 'reject':
      opts.resolve = setStatus('resolve')
      break
    default:
      break
  }
  return callHooks(res.hooks[res.status], opts)
}

export default function apicase(adapter) {
  return function(req, opts) {
    opts = opts || {}
    req = opts.disableNormalization ? req : normalizeOptions(adapter, req)
    if (
      process.env.NODE_ENV !== 'production' &&
      (!req.adapter || typeof req.adapter.callback !== 'function')
    ) {
      throw new TypeError(
        '[Apicase] Adapter should be an object with callback function'
      )
    }

    var bus = new EventBus()
    var res = {
      state: merge({
        started: false,
        pending: false,
        success: false,
        payload: req.payload,
        result: adapter.createState()
      }),
      on(event, cb) {
        bus.on(event, cb)
        return state
      },
      cancel() {
        Promise.resolve()
          .then(function() {
            return cancelCallback()
          })
          .then(function() {
            bus.emit('cancel')
          })
      }
    }
    var cancelCallback = function() {}

    function setRes(path) {
      return function(data) {
        var prev = get(path, res)
        var next = set(path, merge(prev, data))
        bus.emit('change:' + path.split('.').slice(-1), prev, next, data)
      }
    }

    var setState = setRes('state')
    var setPayload = setRes('state.payload')
    var setResult = setRes('state.result')

    function setCancelCallback(cb) {
      cancelCallback = cb
    }

    function resolve(result) {
      setPayload({
        success: true,
        pending: false,
        result: result
      })
      bus.emit('resolve', res.state)
    }

    function reject(result) {
      setPayload({
        success: false,
        pending: false,
        result: result
      })
      bus.emit('reject', res.state)
    }

    function processStart() {
      setState({ started: true })
      bus.emit('start')
      return callHooks(req.hooks.before, {
        payload: res.state.payload,
        meta: req.meta,
        next(payload) {
          setPayload(payload)
          return setStatus('next')(payload)
        },
        resolve: setStatus('resolve', true),
        reject: setStatus('reject', true)
      })
    }

    function processAdapter(res) {
      return res.status === 'next'
        ? new Promise(function(resolve) {
            setState({ pending: true })
            return req.adapter.callback({
              payload: res.payload,
              state: clone(res.state),
              resolve(payload) {
                resolve(setStatus('resolve')(payload))
              },
              reject(payload) {
                resolve(setStatus('reject')(payload))
              },
              emit: bus.emit,
              setState: setState,
              setCancelCallback: setCancelCallback
            })
          })
        : setStatus(res.status, true)(res.payload, res.opts)
    }

    function processFinalHooks(res) {
      var commonData = {
        result: req.state.result,
        meta: req.meta,
        next(result) {
          setResult(result)
        }
      }
      if (res.status === 'resolve') {
        return callHooks(
          req.hooks.resolve,
          merge(commonData, {
            reject(result) {
              setState({
                success: false,
                result: result
              })
              return setState('reject')(result)
            }
          })
        )
      } else {
        return callHooks(
          req.hooks.reject,
          merge(commonData, {
            resolve(result) {
              setState({
                success: true,
                result: result
              })
              return setState('resolve')(result)
            }
          })
        )
      }
      // return callFinalHooks({
      //   status: res.status,
      //   hooks: req.hooks,
      //   meta: req.meta,
      //   payload: res.payload
      // }).then(function(res) {
      //   if (res.success) {
      //     resolve()
      //     bus.emit('resolve', res.state)
      //   } else {
      //     bus.emit('reject', res.state)
      //   }
      // })
    }

    function processError(error) {
      bus.emit('error', error)
    }

    res.promise = processStart()
      .then(processAdapter)
      .then(processFinalHooks)
      .catch(processError)

    return res
  }
}

// export default function apicase(adapter) {
//   return function(req, opts) {
//     opts = opts || {}
//     req = opts.disableNormalization ? req : normalizeOptions(adapter, req)
//     if (
//       process.env.NODE_ENV !== 'production' &&
//       (!req.adapter || typeof req.adapter.callback !== 'function')
//     ) {
//       throw new TypeError(
//         '[Apicase] Adapter should be an object with callback function'
//       )
//     }

//     function processCustomHook(resolve) {
//       return function(type, opts) {
//         callHooks(
//           req.hooks[type],
//           Object.assign({}, opts, {
//             next: setStatus('next'),
//             resolve: setStatus('resolve'),
//             reject: setStatus('reject')
//           })
//         ).then(function(res) {
//           if (res.status === 'resolve' || res.status === 'reject') {
//             resolve(setStatus(res.status)(res.payload))
//           }
//         })
//       }
//     }

//     function processAdapter(res) {
//       return res.status === 'next'
//         ? new Promise(function(resolve) {
//             return req.adapter.callback({
//               payload: res.payload,
//               resolve(payload) {
//                 resolve(setStatus('resolve')(payload))
//               },
//               reject(payload) {
//                 resolve(setStatus('reject')(payload))
//               },
//               callHook: processCustomHook(resolve)
//             })
//           })
//         : setStatus(res.status, true)(res.payload, res.opts)
//     }

//     function processFinalHooks(res) {
//       return res.opts.skipHooks
//         ? Promise[res.status](res.payload)
//         : callFinalHooks({
//             status: res.status,
//             hooks: req.hooks,
//             meta: req.meta,
//             payload: res.payload
//           })
//     }

//     return callHooks(req.hooks.before, {
//       payload: req.payload,
//       meta: req.meta,
//       next: setStatus('next'),
//       resolve: setStatus('resolve', true),
//       reject: setStatus('reject', true)
//     })
//       .then(processAdapter)
//       .then(processFinalHooks)
//   }
// }
