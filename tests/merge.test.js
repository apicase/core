import mergeOptions from '../lib/merge'

describe('Adapters', () => {
  it('if none provided, returns null', () => {
    const from = {}
    const to = {}
    expect(mergeOptions([from, to]).adapter).toEqual(null)
  })

  it('if only first provided, returns the first one', () => {
    const from = { adapter: { callback: console.log } }
    const to = {}
    expect(mergeOptions([from, to]).adapter).toEqual(from.adapter)
  })

  it('if only second provided, returns the second one', () => {
    const from = {}
    const to = { adapter: { callback: console.log } }
    expect(mergeOptions([from, to]).adapter).toEqual(to.adapter)
  })

  it('if both provided, returns the second one', () => {
    const from = { adapter: { callback: console.log } }
    const to = { adapter: { callback: console.debug } }
    expect(mergeOptions([from, to]).adapter).toEqual(to.adapter)
  })
})

describe('Payloads', () => {
  it('if none provided, returns null', () => {
    const from = {}
    const to = {}
    expect(mergeOptions([from, to]).payload).toBe(null)
  })

  it('if only first provided, returns the first one', () => {
    const from = { payload: 1 }
    const to = {}
    expect(mergeOptions([from, to]).payload).toBe(1)
  })

  it('if only second provided, returns the second one', () => {
    const from = {}
    const to = { payload: 1 }
    expect(mergeOptions([from, to]).payload).toBe(1)
  })

  it('if adapter has .merge() callabck, return its value (newest adapter prefered)', () => {
    const from = { adapter: { merge: (from, to) => from + to + 1 }, payload: 1 }
    const to = { adapter: { merge: (from, to) => from + to + 5 }, payload: 2 }
    expect(mergeOptions([from, to]).payload).toBe(8)
  })

  it('otherwise, returns the second one', () => {
    const from = { payload: 1 }
    const to = { payload: 2 }
    expect(mergeOptions([from, to]).payload).toBe(2)
  })
})

describe('Meta', () => {
  it('just merges meta', () => {
    const from = { meta: { a: 1, b: 2 } }
    const to = { meta: { a: 2, c: 2 } }
    expect(mergeOptions([from, to]).meta).toEqual({
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
    expect(mergeOptions([from, to]).hooks).toEqual({
      before: [],
      resolve: [],
      reject: []
    })
  })

  it('if only first provided, returns normalized first object', () => {
    const from = { hooks: { before: [console.log] } }
    const to = {}
    expect(mergeOptions([from, to]).hooks).toEqual({
      before: [console.log],
      resolve: [],
      reject: []
    })
  })

  it('if only second provided, returns normalized second object', () => {
    const from = {}
    const to = { hooks: { before: [console.log] } }
    expect(mergeOptions([from, to]).hooks).toEqual({
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
    expect(mergeOptions([from, to]).hooks).toEqual({
      before: [console.log, console.debug],
      resolve: [console.warn],
      reject: [console.error]
    })
  })
})
