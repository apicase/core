import clone from 'clone'
import merge from 'deepmerge'

// TODO: Complete this
const mergeQuery = (queries) =>
  merge(...queries)

const mergeWithConcat = (options) =>
  options.reduce((a, b) => {
    Object.keys(b).forEach(k => {
      if (!a[k]) {
        a[k] = Array.isArray(b[k]) ? clone(b[k]) : [clone(b[k])]
      } else {
        a[k] = a[k].concat(b[k])
      }
    })
    return a
  }, {})

export default (...opts) => ({
  query: mergeQuery(opts.map(i => i.query || {})),
  hooks: mergeWithConcat(opts.map(i => i.hooks || {})),
  interceptors: mergeWithConcat(opts.map(i => i.interceptors || {}))
})
