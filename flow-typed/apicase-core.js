declare module 'apicase-core' {
  // Generics

  declare type HooksT<T> = {
    [hookType: string]: T
  }

  // Entities

  declare type QueryPair = [string, string | number]

  declare type QueryPairs = QueryPair[]

  declare type Hook = (ctx: Object, next: Function) => void

  declare type HooksObject = HooksT<Hook[]>

  declare type HooksComposition = (ctx: any) => Promise<any>

  declare type ComposedHooksObject = HooksT<HooksComposition>

  declare type UnnormalizedHooksObject = HooksT<Hook | Hook[]>

  declare type EventName = 'before' | 'start' | 'success' | 'error' | 'finish' | 'preinstall' | 'postinstall'

  declare type CurriedEventBus = (event: string) => (data: any) => any

  declare type AllOptions = {
    adapter?: string,
    hooks?: UnnormalizedHooksObject
  }

  declare type Adapter<Options> = (query: {
    options: Options,
    done: (data: mixed) => void,
    fail: (reason: mixed) => void,
    another: (hookType: string, data: mixed, reject?: boolean) => void
  }) => void

  declare type Plugin<T> = (instance: Apicase, options?: T) => void

  declare type Apicase = {
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
    install: (installer: Plugin<any>, options: any) => void,
    extend: (installer: Plugin<any>, options: any) => Apicase,
    on: (event: EventName, callback: (...args: any[]) => void) => void,
    // For plugins
    [string]: any
  }
  declare module.exports: Apicase;
}
