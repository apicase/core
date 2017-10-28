// @flow
import { type Lens } from 'ramda'

// Generics

export type HooksT<T> = {
  [hookType: string]: T
}
export type InterceptorsT<T> = {
  adapter: string,
  handler: T
}

// Query
export type QueryPair = [string, string | number]
export type QueryPairs = QueryPair[]

// Hooks
export type Hook = (ctx: Object, next: Function) => void
export type HooksObject = HooksT<Hook[]>
export type HooksComposition = (ctx: any) => Promise<any>
export type ComposedHooksObject = HooksT<HooksComposition>
export type UnnormalizedHooksObject = HooksT<Hook | Hook[]>

// Interceptors
export type RequestInterceptor = ({ options: AllOptions }) => AllOptions
export type SuccessInterceptor = (res: { data: any, options: AllOptions, wasFailed: boolean }, fail: Function) => any
export type ErrorInterceptor = (res: { reason: any, options: AllOptions, wasSuccess: boolean }, done: Function) => any
export type AbortInterceptor = (res: { reason: any, options: AllOptions }) => any
export type InterceptorsObject = {
  request?: Array<RequestInterceptor | InterceptorsT<RequestInterceptor>>,
  success?: Array<SuccessInterceptor | InterceptorsT<SuccessInterceptor>>,
  error?: Array<ErrorInterceptor | InterceptorsT<ErrorInterceptor>>,
  abort?: Array<AbortInterceptor | InterceptorsT<AbortInterceptor>>
}
export type normalizedInterceptors = {
  request?: InterceptorsT<RequestInterceptor>[],
  success?: InterceptorsT<SuccessInterceptor>[],
  error?: InterceptorsT<ErrorInterceptor>[],
  abort?: InterceptorsT<AbortInterceptor>[]
}

// Events
export type EventName = 'before' | 'start' | 'success' | 'error' | 'finish' | 'preinstall' | 'postinstall'
export type CurriedEventBus = (event: string) => (data: any) => any

export type AllOptions = {
  adapter?: string,
  hooks?: UnnormalizedHooksObject,
  interceptors?: InterceptorsObject
}

export type Adapter<Options> = (query: {
  options: Options,
  done: (data: mixed) => void,
  fail: (reason: mixed) => void,
  another: (hookType: string, data: mixed, reject?: boolean) => void,
  instance: Apicase
}) => void

export type Plugin<T> = (instance: Apicase, options?: T) => void

export type Apicase = {
  base: {
    query: Object,
    hooks: HooksObject,
    interceptors: InterceptorsObject
  },
  options: {
    defaultAdapter: string
  },
  adapters: {
    [adapterName: string]: Adapter<Object>
  },
  use: (adapterName: string, adapter: Adapter<Object>) => void,
  call: (options: AllOptions) => Promise<mixed>,
  all: (options: AllOptions[]) => Promise<mixed>,
  of: (options: AllOptions) => Apicase,
  install: (installer: Plugin<any>, options: any) => void,
  extend: (installer: Plugin<any>, options: any) => Apicase,
  on: (event: EventName, callback: (...args: any[]) => void) => void,
  emit: (event: EventName, ...args: any[]) => void,
  // For plugins
  [string]: any
}

// Helpers
export type isNotEmpty = (obj: Object) => boolean
export type overAll = (lens: Lens) => (cb: (obj: Object) => Object) => (data: Object) => Object
export type rename = (keyFrom: string, keyTo: string, obj: Object) => Object

// Work with url
export type encodePairs = (parts: QueryPairs) => QueryPairs
export type joinParts = (parts: QueryPairs) => string
export type addQuestionSign = (uri: string) => string
export type jsonToQueryString = (json: Object) => string

// Compose and async pipe
export type pipeM = (...fns: Function[]) => (arg: mixed) => Promise <mixed>
export type composeHooks = (fns: Hook[]) => (ctx: any) => Promise<any>
export type mapComposeHooks = (obj: HooksObject) => ComposedHooksObject

// Normalizing
export type normalizeHooks = (UnnormalizedHooksObject) => HooksObject
export type evaluateHeaders = (headers: Object | Function) => Object
export type normalizeInterceptors = (handlers: InterceptorsT<Function>, adapter: string) => normalizedInterceptors

// Merging
export type mergeHooks = (a: UnnormalizedHooksObject, b: UnnormalizedHooksObject) => HooksObject
export type mergeOptions = (...opts: Object[]) => Object
export type mergeInterceptors = (a: InterceptorsObject) => (...b: InterceptorsObject[]) => InterceptorsObject

// Wrappers
export type curryBus = (bus: Object) => CurriedEventBus
export type createHandler = (emit: CurriedEventBus, hooks: ComposedHooksObject) => (name: string) => (data: any) => any
export type filterInterceptors = (adapter: string) => InterceptorsT<any>
