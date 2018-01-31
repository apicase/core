import defaults from './defaults'
import clone from 'nanoclone'
import normalizeOptions from './normalize'

function mergeWith(cb, from, to) {
  return Object.keys(to).reduce(function(res, key) {
    res[key] = cb(from[key], to[key])
    return res
  }, from)
}

var mergers = {
  adapter(from, to) {
    return to || from
  },
  hooks(from, to) {
    return mergeWith(
      function(from, to) {
        return (from || []).concat(to)
      },
      from,
      to
    )
  },
  meta(from, to) {
    return mergeWith(
      function(from, to) {
        return to
      },
      from,
      to
    )
  },
  payload(from, to, res) {
    return res.adapter && res.adapter.merge
      ? res.adapter.merge(from, to)
      : to === null ? from : to
  }
}

export default function mergeOptions(opts) {
  opts = opts.map(function(opt) {
    return typeof opt === 'function' ? opt() : opt
  })
  opts = clone(opts).map(normalizeOptions)
  var def = clone(defaults)
  return Object.keys(mergers).reduce(function(res, key) {
    res[key] = opts.reduce(function(opt, next, index, opts) {
      return mergers[key](opt, next[key], res, index, opts)
    }, def[key])
    return res
  }, def)
}
