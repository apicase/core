import normalizeOptions from '../lib/normalize'

describe('Default options', () => {
  const res = normalizeOptions()

  it('sets adapter = null', () => {
    expect(res.adapter).toEqual(null)
  })

  it('sets empty payload object', () => {
    expect(res.payload).toEqual({})
  })

  it('sets empty meta object', () => {
    expect(res.meta).toEqual({})
  })

  it('sets object with empty arrays of default hooks', () => {
    expect(res.hooks).toEqual({ before: [], resolve: [], reject: [] })
  })
})

describe('Convert', () => {
  it('adds adapter', () => {
    const adapter = {
      callback: ({ payload, resolve }) => resolve(payload)
    }
    const res = normalizeOptions(adapter, {})
    expect(res.adapter).toBe(adapter)
  })

  it('adds meta', () => {
    const meta = {
      a: 2
    }
    const res = normalizeOptions(null, { meta })
    expect(res.meta).toBe(meta)
  })

  it('adds hooks', () => {
    const hooks = {
      before: [({ payload, next }) => next(payload)],
      reject: [],
      resolve: []
    }
    const res = normalizeOptions(null, { hooks })
    expect(res.hooks).toEqual(hooks)
  })

  it('adds all unknown properties to payload', () => {
    const payload = {
      a: 2,
      b: 3,
      lol: 'test'
    }
    const res = normalizeOptions(null, payload)
    expect(res.payload).toEqual(payload)
  })
})
