var wrapper = function createWrapperCreator (type) {
  return function createWrapper (cb) {
    return function hookWrapper (ctx, next) {
      try {
        cb(ctx, next)
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
