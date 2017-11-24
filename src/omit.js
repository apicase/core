module.exports = function omit (keys, src) {
  const obj = {}
  for (let key in src) {
    if (!keys.includes(key)) {
      obj[key] = src[key]
    }
  }
  return obj
}
