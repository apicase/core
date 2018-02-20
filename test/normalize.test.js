import { normalizeOptions } from '../lib/normalize'

describe('Hooks', () => {
  it('converts hooks to array of hooks', () => {
    const opts = {
      hooks: {
        before() { },
        resolve: [() => { }, () => { }]
      }
    }
    const h = normalizeOptions(opts).hooks
    expect(h.before).toEqual([opts.hooks.before])
    expect(h.resolve).toEqual([opts.hooks.resolve[0], opts.hooks.resolve[1]])
  })

  it('creates default hooks properties', () => {
    const h = normalizeOptions({}).hooks
    expect(h).toEqual({
      before: [],
      resolve: [],
      reject: []
    })
  })
})

describe('Meta', () => {
  it('leaves meta "as is"', () => {
    expect(normalizeOptions({ meta: { a: 2 } }).meta).toEqual({ a: 2 })
  })

  it("creates empty object when it's not passed", () => {
    expect(normalizeOptions({}).meta).toEqual({})
  })
})

describe('Payload', () => {
  it('passes all another properties to payload', () => {
    const opts = { a: 1, b: 2 }
    const normalized = normalizeOptions(opts)
    expect('a' in normalized).toBeFalsy()
    expect('b' in normalized).toBeFalsy()
    expect(normalized.payload).toEqual(opts)
  })
})

describe('Applying normalize 2+ times', () => {
  it('adds _isNormalized flag', () => {
    expect(normalizeOptions({})._isNormalized).toBeTruthy()
  })

  it('does not normalize object that has already done', () => {
    const opts = {
      a: 1,
      b: 2,
      hooks: {
        before: () => { }
      }
    }
    const res = normalizeOptions(normalizeOptions(opts))
    expect(res).toEqual({
      _isNormalized: true,
      payload: { a: 1, b: 2 },
      meta: {},
      hooks: {
        before: [opts.hooks.before]
      }
    })
  })
})
