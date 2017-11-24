var merge = require('deepmerge')

// TODO: Complete this
var mergeQuery = function (queries) {
  return merge(...queries)
}

var reducer = function (a, b) {
  Object.keys(b).forEach(function (k) {
    a[k] = a[k]
      ? a[k].concat(b[k])
      : [].concat(b[k])
  })
  return a
}

var mergeWithConcat = function (options) {
  return options.reduce(reducer, {})
}

module.exports = function mergeOptions (...opts) {
  return {
    query: mergeQuery(opts.map(i => i.query || {})),
    hooks: mergeWithConcat(opts.map(i => i.hooks || {})),
    interceptors: mergeWithConcat(opts.map(i => i.interceptors || {}))
  }
}
