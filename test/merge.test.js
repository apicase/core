import { mergeOptions } from '../lib/merge'

it('normalizes obj before merge', () => {
  expect(mergeOptions(null, [{}, {}])).toEqual({
    _isNormalized: true,
    adapter: null,
    payload: {},
    meta: {},
    hooks: {
      before: [],
      resolve: [],
      reject: []
    }
  })
})

describe('Hooks', () => {
  it('merges hooks with concatenation', () => {
    const p1 = {
      hooks: {
        resolve: [() => {}]
      }
    }
    const p2 = {
      hooks: {
        resolve: [() => {}]
      }
    }
    const merged = mergeOptions(null, [p1, p2])
    expect(merged).toHaveProperty('hooks')
    expect(merged.hooks).toHaveProperty('resolve')
    expect(merged.hooks.resolve).toEqual([
      p1.hooks.resolve[0],
      p2.hooks.resolve[0]
    ])
  })

  it('correctly works with hooks declared as just a function (not array)', () => {
    const p1 = {
      hooks: {
        before: () => {},
        resolve: [() => {}]
      }
    }
    const p2 = {
      hooks: {
        resolve: [() => {}],
        reject: () => {}
      }
    }
    expect(mergeOptions(null, [p1, p2]).hooks).toEqual({
      before: [p1.hooks.before],
      resolve: [p1.hooks.resolve[0], p2.hooks.resolve[0]],
      reject: [p2.hooks.reject]
    })
  })
})

describe('Meta', () => {
  it('works like assign', () => {
    const p1 = {
      meta: {
        a: 1,
        b: 1
      }
    }
    const p2 = { meta: { b: 2, c: 2 } }
    expect(mergeOptions(null, [p1, p2]).meta).toEqual({
      a: 1,
      b: 2,
      c: 2
    })
  })
})

describe('Payload', () => {
  it('uses merge strategy of adapter if adapter.merge is provided', () => {
    const adapter = {
      merge: (from, to) => ({ a: (from.a || 0) + to.a })
    }
    const p1 = {
      a: 1
    }
    const p2 = {
      a: 2
    }
    expect(mergeOptions(adapter, [p1, p2]).payload).toEqual({
      a: 3
    })
  })

  it('otherwise, just merges it', () => {
    const p1 = {
      a: 1,
      b: 1
    }
    const p2 = {
      b: 2,
      c: 2
    }
    expect(mergeOptions(null, [p1, p2]).payload).toEqual({
      a: 1,
      b: 2,
      c: 2
    })
  })
})
