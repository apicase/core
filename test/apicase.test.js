import { apicase } from '../lib/apicase'

const resolveAdapter = {
  callback: ({ payload, resolve }) => setTimeout(resolve, 25, payload)
}

const rejectAdapter = {
  callback: ({ payload, reject }) => setTimeout(reject, 25, payload)
}

describe('Calls', () => {
  it('calls adapter callback() with payload', done => {
    const callback = jest.fn(({ payload, resolve }) => {
      expect(payload).toEqual({ a: 1 })
      resolve(payload)
    })

    apicase({ callback })({ a: 1 }).on('resolve', res => {
      expect(callback).toBeCalled()
      done()
    })
  })

  it('returns thenable object with state, cancel() and on() methods', async done => {
    const res = apicase(resolveAdapter)({ a: 1 })
    expect(res.state).toEqual({
      success: false,
      pending: true,
      started: true,
      payload: { a: 1 },
      result: {}
    })
    await res
    done()
  })
})

describe('Adapters', () => {
  it('has payload, result resolve and reject callbacks', done => {
    const callback = jest.fn(({ payload, result, resolve, reject }) => {
      expect(payload).toEqual({ a: 1 })
      expect(result).toEqual({})
      expect(typeof resolve).toBe('function')
      expect(typeof reject).toBe('function')
      resolve(payload)
    })

    apicase({ callback })({ a: 1 }).on('resolve', res => {
      done()
    })
  })

  it('creates state if createState() callback provided', done => {
    const createState = () => ({ a: 1, b: 2 })
    const callback = jest.fn(({ payload, result, resolve }) => {
      expect(result).toEqual({ a: 1, b: 2 })
      resolve(payload)
    })

    apicase({ callback, createState })({ a: 2 }).on('resolve', res => {
      done()
    })
  })

  it('has setResult() callback to merge new state with old (like resolve)', done => {
    const createState = () => ({ a: 1, b: 2 })
    const callback = jest.fn(({ payload, result, resolve, setResult }) => {
      setResult({ b: 3 })
      resolve(payload)
    })

    apicase({ callback, createState })({ a: 2 }).on('resolve', res => {
      expect(res).toEqual({ a: 2, b: 3 })
      done()
    })
  })

  it('converts payload before callback if convert() provided', done => {
    const convert = payload => ({ ...payload, a: 2 })
    const callback = jest.fn(({ payload, result, resolve, setResult }) => {
      expect(payload).toEqual({ a: 2, b: 3 })
      resolve(payload)
    })

    apicase({ callback, convert })({ b: 3 }).on('resolve', res => {
      done()
    })
  })

  it('can be cancelled if used setCancelCallback() and emits cencel event', done => {
    const cancelCallback = jest.fn(timer => () => clearTimeout(timer))
    const callback = jest.fn(
      ({ payload, result, resolve, setCancelCallback }) => {
        const timer = setTimeout(resolve, 1000, payload)
        setCancelCallback(cancelCallback(timer))
      }
    )

    const resolve = jest.fn(() => {})
    const cancel = res => {
      expect(resolve).not.toBeCalled()
      expect(cancelCallback).toBeCalled()
      done()
    }

    const call = apicase({ callback })({ b: 3 })
      .on('resolve', resolve)
      .on('cancel', cancel)

    call.cancel()
  })

  it('resolves request on resolve() call and rejects on reject()', done => {
    apicase(resolveAdapter)({ a: 1 }).on('resolve', res => {
      apicase(rejectAdapter)(res).on('reject', res => {
        expect(res).toEqual({ a: 1 })
        done()
      })
    })
  })
})

describe('Hooks', () => {
  describe('Before hooks', () => {
    it('calls before hooks queue', done => {
      const before = new Array(3)
        .fill(null)
        .map(i =>
          jest.fn(({ payload, next }) => next({ ...payload, a: payload.a + 1 }))
        )

      apicase(resolveAdapter)({ a: 1, hooks: { before } }).on(
        'resolve',
        res => {
          expect(res.a).toBe(4)
          before.forEach(i => expect(i).toBeCalled())
          done()
        }
      )
    })
  })

  describe('Resolve hooks', () => {})

  describe('Reject hooks', () => {})
})

describe('Events', () => {
  it('emits start event on request start', () => {})

  it('emits finish event on request finish', () => {})

  it('emits cancel event on request cancel', () => {})

  it('emits resolve event on adapter resolve', () => {})

  it('emits reject event on adapter reject', () => {})

  it('emits change:state event on state change', () => {})

  it('emits change:payload event on payload change', () => {})

  it('emits change:result event on result change', () => {})
})

describe('State', () => {})
