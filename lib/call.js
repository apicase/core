import { apicase } from './apicase'
import { omit } from 'nanoutils'

export function apiCall(opt, prev) {
  return opt._isApiService
    ? opt.call(prev)
    : apicase(opt.adapter)(omit(['adapter'], opt))
}
