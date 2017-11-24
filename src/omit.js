module.exports = function omit (keys, src) {
  var obj = {}
  for (var key in src) {
    if (!keys.includes(key)) {
      obj[key] = src[key]
    }
  }
  return obj
}
