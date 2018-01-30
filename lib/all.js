import apicase from './call'

export default function apiAll(opts) {
  return Promise.all(opts.map(apicase))
}
