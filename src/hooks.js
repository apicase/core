var wrapper = function createWrapperCreator (type, meta) {
  return function createWrapper (cb) {
    return function hookWrapper (ctx, next) {
      try {
        if (type !== 'before') {
          cb(ctx, next)
        } else {
          // if (meta.isAborted) return
          cb(ctx, next, function abortCallback (reason) {
            meta.isAborted = true
            meta.abortReason = reason
          })
        }
        if (cb.name && cb.name !== 'endCallback') {
          meta.hooks[type].called++
        }
      } catch (err) {
        logger(type, cb, err)
      }
    }
  }
}

var logger = function hookErrorLogger (type, cb, err) {
  var name = cb.name && cb.name !== type
    ? cb.name
    : 'anonymous'
  console.error('[Apicase] Error in ' + type + ' hook')
  console.error('[Apicase] Hook name: ' + name)
  throw err
}

module.exports = {
  wrapper,
  logger
}
