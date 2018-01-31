import normalizeOptions from '../lib/normalize'

it('sets default options', () => {
  const res = normalizeOptions()
  expect(res.adapter).toBe(null)
  expect(res.payload).toBe(null)
  expect(res.hooks).toEqual({ before: [], resolve: [], reject: [] })
})

describe('Adapter', () => {
  it('get adapter from 2nd object if string given', () => {
    const adapters = {
      fetch: {
        callback: (p, { next }) => next(p)
      }
    }
    const opts = {
      adapter: 'fetch'
    }
    const res = normalizeOptions(opts, adapters)
    expect(res.adapter).toBe(adapters.fetch)
  })

  it('converts payload if adapter has .convert() method', () => {
    const adapters = {
      fetch: {
        callback: (p, { next }) => next(p),
        convert: payload => payload + 1
      }
    }
    const opts = {
      adapter: 'fetch',
      payload: 1
    }
    const res = normalizeOptions(opts, adapters)
    expect(res.payload).toBe(2)
  })
})
