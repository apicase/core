const log = require('./log')

function createAbortCallback (meta) {
  return function abortCallback (reason) {
    meta.isAborted = true
    meta.abortReason = reason
  }
}

function createWrapperCreator (type, meta, options) {
  return function createWrapper (cb) {
    return function hookWrapper (ctx, next) {
      try {
        // Calls abortion feature
        if (type === 'before') {
          cb(options, next, createAbortCallback(meta))
        } else {
          cb(ctx, options, next)
        }
        // For future debugging ideas
        if (cb.name && cb.name !== 'endCallback') {
          meta.hooks[type].called++
        }
      } catch (err) {
        hookErrorLogger(type, cb, err)
      }
    }
  }
}

function hookErrorLogger (type, cb, err) {
  var name = cb.name && cb.name !== type
    ? cb.name
    : 'anonymous'
  log.warn('Error in ' + type + ' hook')
  log.warn('Hook name: ' + name)
  throw err
}

module.exports = {
  wrapper: createWrapperCreator,
  logger: hookErrorLogger
}
