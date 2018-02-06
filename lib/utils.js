// TODO: replace it with nanoutils (when it comes production-ready)
// There are no ramda/lodash for size economy reasons
export function omit(keys, obj) {
  return Object.keys(obj)
    .filter(function(key) {
      return !keys.includes(key)
    })
    .reduce(function(res, key) {
      res[key] = obj[key]
      return res
    }, {})
}

export function evolve(callbacks, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callbacks[key] ? callbacks[key](obj[key], res, obj) : obj[key]
    return res
  }, {})
}

export function evolveAll(callback, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = callback(obj[key], key)
    return res
  }, {})
}

export function defaults(def, obj) {
  return Object.keys(obj).reduce(function(res, key) {
    res[key] = obj[key] || res[key]
    return res
  }, clone(def))
}
