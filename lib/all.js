import apicase from './call'

export default function callAll(opts) {
  return Promise.all(opts.map(apicase))
}
