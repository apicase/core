var mergeOptions = require('../cjs/merge')

describe('Adapters', () => {
  it('accepts adapter as the first argument', () => {
    const adapter = {
      callback: ({ payload, resolve }) => resolve(payload)
    }
    const from = {}
    const to = {}
    expect(mergeOptions(adapter, [from, to]).adapter).toEqual(adapter)
  })
})

describe('Payloads', () => {
  it('if none provided, returns an empty oblect', () => {
    const from = {}
    const to = {}
    expect(mergeOptions(null, [from, to]).payload).toEqual({})
  })

  it('if only first provided, returns the first one', () => {
    const from = { a: 1 }
    const to = {}
    expect(mergeOptions(null, [from, to]).payload).toEqual({ a: 1 })
  })

  it('if only second provided, returns the second one', () => {
    const from = {}
    const to = { a: 1 }
    expect(mergeOptions(null, [from, to]).payload).toEqual({ a: 1 })
  })

  it('if adapter has .merge() callabck, return its value', () => {
    const adapter = { merge: (from, to) => ({ a: from.a + to.a }) }
    const from = { a: 1 }
    const to = { a: 2 }
    expect(mergeOptions(null, [from, to]).payload).toEqual({ a: 2 })
  })

  it('otherwise, assigns them', () => {
    const from = { a: 1 }
    const to = { b: 2 }
    expect(mergeOptions(null, [from, to]).payload).toEqual({ a: 1, b: 2 })
  })
})

describe('Meta', () => {
  it('just merges meta', () => {
    const from = { meta: { a: 1, b: 2 } }
    const to = { meta: { a: 2, c: 2 } }
    expect(mergeOptions(null, [from, to]).meta).toEqual({
      a: 2,
      b: 2,
      c: 2
    })
  })
})

describe('Hooks', () => {
  it('if none provided, returns default hooks object', () => {
    const from = {}
    const to = {}
    expect(mergeOptions(null, [from, to]).hooks).toEqual({
      before: [],
      resolve: [],
      reject: []
    })
  })

  it('if only first provided, returns normalized first object', () => {
    const from = { hooks: { before: [console.log] } }
    const to = {}
    expect(mergeOptions(null, [from, to]).hooks).toEqual({
      before: [console.log],
      resolve: [],
      reject: []
    })
  })

  it('if only second provided, returns normalized second object', () => {
    const from = {}
    const to = { hooks: { before: [console.log] } }
    expect(mergeOptions(null, [from, to]).hooks).toEqual({
      before: [console.log],
      resolve: [],
      reject: []
    })
  })

  it('if both provided, merge them with concatenation', () => {
    const from = {
      hooks: {
        before: [console.log],
        resolve: [console.warn]
      }
    }
    const to = {
      hooks: {
        before: [console.debug],
        reject: [console.error]
      }
    }
    expect(mergeOptions(null, [from, to]).hooks).toEqual({
      before: [console.log, console.debug],
      resolve: [console.warn],
      reject: [console.error]
    })
  })
})

describe('More', () => {
  it('merges more than 2 services', () => {
    const adapter = {
      callback: console.log,
      merge: (a, b) => ({ foo: (a.foo || '') + b.foo })
    }
    const a = {
      foo: 'A',
      hooks: { before: [console.log] }
    }
    const b = { foo: 'B', hooks: { before: [console.log] } }
    const c = { foo: 'C', hooks: { resolve: [console.log] } }
    expect(mergeOptions(adapter, [a, b, c])).toEqual({
      adapter,
      payload: { foo: 'ABC' },
      meta: {},
      hooks: {
        before: [console.log, console.log],
        resolve: [console.log],
        reject: []
      }
    })
  })

  it('accepts opts passed as a function and invokes them before merge', () => {
    let date
    const a = () => ({
      a: 'payload',
      b: 'lol'
    })
    const b = () => ({
      b: 'test',
      c: 'foo'
    })
    expect(mergeOptions(null, [a, b])).toEqual({
      adapter: null,
      payload: {
        a: 'payload',
        b: 'test',
        c: 'foo'
      },
      meta: {},
      hooks: {
        before: [],
        resolve: [],
        reject: []
      }
    })
  })
})
