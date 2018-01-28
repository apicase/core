import apicase from './call'
import mergeOptions from './merge'

export default function service(opts) {
  var isNormalized = false

  this.extend = function(opts) {
    return service(mergeOptions(this.opts, opts, meta))
  }

  this.call = function(req, meta) {
    meta = meta || {}
    meta.disableNormalize = true
    return apicase(mergeOptions(opts, req), meta)
  }
}

const adapter = {
  callback: (payload, { resolve }) => resolve(payload)
}

const aaa = new service({
  adapter,
  payload: 2,
  hooks: {
    before: [(payload, { next }) => next(payload + 1)]
  }
})

aaa
  .call({
    payload: 7,
    hooks: {
      before: [(payload, { next }) => next(payload + 1)]
    }
  })
  .then(console.log)
