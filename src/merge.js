var merge = require('deepmerge')

// TODO: Complete this
function mergeQuery (queries) {
  return merge(...queries)
}

function reducer (a, b) {
  Object.keys(b).forEach(function (k) {
    a[k] = a[k]
      ? a[k].concat(b[k])
      : [].concat(b[k])
  })
  return a
}

function mergeWithConcat (options) {
  return options.reduce(reducer, {})
}

module.exports = function mergeOptions (...opts) {
  return {
    query: mergeQuery(opts.map(i => i.query || {})),
    hooks: mergeWithConcat(opts.map(i => i.hooks || {})),
    interceptors: mergeWithConcat(opts.map(i => i.interceptors || {}))
  }
}
