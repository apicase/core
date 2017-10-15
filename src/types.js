// @flow
import { type Lens } from 'ramda'

// Generics

export type HooksT<T> = {
  [hookType: string]: T
}

// Entities

export type QueryPair = [string, string | number]

export type QueryPairs = QueryPair[]

export type Hook = (ctx: Object, next: Function) => void

export type HooksObject = HooksT<Hook[]>

export type HooksComposition = (ctx: any) => Promise<any>

export type ComposedHooksObject = HooksT<HooksComposition>

export type UnnormalizedHooksObject = HooksT<Hook | Hook[]>

export type EventName = 'before' | 'start' | 'success' | 'error' | 'finish' | 'preinstall' | 'postinstall'

export type CurriedEventBus = (event: string) => (data: any) => any

export type AllOptions = {
  adapter?: string,
  hooks?: UnnormalizedHooksObject
}

export type Adapter<Options> = (query: {
  options: Options,
  done: (data: mixed) => void,
  fail: (reason: mixed) => void,
  another: (hookType: string, data: mixed, reject?: boolean) => void,
  instance: Apicase
}) => void

export type Plugin = (instance: Apicase, options: any) => void

export type Apicase = {
  base: {
    query: Object,
    hooks: HooksObject
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
  install: (installer: Plugin, options: any) => void,
  extend: (installer: Plugin, options: any) => Apicase,
  on: (event: EventName, callback: (...args: any[]) => void) => void,
  // For plugins
  [string]: any
}

// Methods

export type isNotEmpty = (obj: Object) => boolean

export type encodePairs = (parts: QueryPairs) => QueryPairs

export type joinParts = (parts: QueryPairs) => string

export type addQuestionSign = (uri: string) => string

export type jsonToQueryString = (json: Object) => string

export type overAll = (lens: Lens) => (cb: (obj: Object) => Object) => (data: Object) => Object

export type rename = (keyFrom: string, keyTo: string, obj: Object) => Object

export type composeHooks = (fns: Hook[]) => (ctx: any) => Promise<any>

export type pipeM = (...fns: Function[]) => (arg: mixed) => Promise <mixed>

export type evaluateHeaders = (headers: Object | Function) => Object

export type normalizeHooks = (UnnormalizedHooksObject) => HooksObject

export type mergeHooks = (a: UnnormalizedHooksObject, b: UnnormalizedHooksObject) => HooksObject

export type mapComposeHooks = (obj: HooksObject) => ComposedHooksObject

export type mergeOptions = (...opts: Object[]) => Object

export type curryBus = (bus: Object) => CurriedEventBus

export type createHandler = (emit: CurriedEventBus, hooks: ComposedHooksObject) => (name: string) => (data: any) => any
