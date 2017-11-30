var merge = require('deepmerge')

// TODO: Complete this
function mergeQuery (queries) {
  return merge.apply(null, queries)
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

function get (object, key, defaultValue) {
  return object[key] || defaultValue
}

module.exports = function mergeOptions () {
  var opts = []
  for (let index in arguments) {
    opts.push(arguments[index])
  }
  return {
    query: mergeQuery(opts.map(function getQuery (i) {
      return get(i, 'query', {})
    })),
    hooks: mergeWithConcat(opts.map(function getHooks (i) {
      return get(i, 'hooks', {})
    })),
    interceptors: mergeWithConcat(opts.map(function getInterceptors (i) {
      return get(i, 'interceptors', {})
    })),
    pipeMethod: opts[0].pipeMethod
  }
}
