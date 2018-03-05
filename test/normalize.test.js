import { normalizeOptions } from '../lib/normalize'

describe('Hooks', () => {
  it('converts hooks to array of hooks', () => {
    const opts = {
      hooks: {
        before() {},
        done: [() => {}, () => {}]
      }
    }
    const h = normalizeOptions(null, opts).hooks
    expect(h.before).toEqual([opts.hooks.before])
    expect(h.done).toEqual([opts.hooks.done[0], opts.hooks.done[1]])
  })

  it('creates default hooks properties', () => {
    const h = normalizeOptions(null, {}).hooks
    expect(h).toEqual({
      before: [],
      done: [],
      fail: []
    })
  })
})

describe('Meta', () => {
  it('leaves meta "as is"', () => {
    expect(normalizeOptions(null, { meta: { a: 2 } }).meta).toEqual({ a: 2 })
  })

  it("creates empty object when it's not passed", () => {
    expect(normalizeOptions(null, {}).meta).toEqual({})
  })
})

describe('Payload', () => {
  it('passes all another properties to payload', () => {
    const opts = { a: 1, b: 2 }
    const normalized = normalizeOptions(null, opts)
    expect('a' in normalized).toBeFalsy()
    expect('b' in normalized).toBeFalsy()
    expect(normalized.payload).toEqual(opts)
  })
})

describe('Applying normalize 2+ times', () => {
  it('adds _isNormalized flag', () => {
    expect(normalizeOptions(null, {})._isNormalized).toBeTruthy()
  })

  it('does not normalize object that has already done', () => {
    const opts = {
      a: 1,
      b: 2,
      hooks: {
        before: () => {}
      }
    }
    const res = normalizeOptions(null, normalizeOptions(null, opts))
    expect(res).toEqual({
      _isNormalized: true,
      adapter: null,
      payload: { a: 1, b: 2 },
      meta: {},
      options: {
        once: true,
        immediate: true
      },
      hooks: {
        before: [opts.hooks.before],
        done: [],
        fail: []
      }
    })
  })
})
