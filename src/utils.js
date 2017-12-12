function omit (keys, src) {
  var obj = {}
  for (var key in src) {
    if (!keys.includes(key)) {
      obj[key] = src[key]
    }
  }
  return obj
}

function unary (callback) {
  return function unaryCallback (arg) {
    return callback(arg)
  }
}

module.exports = {
  omit,
  unary
}
