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
      cancelled: false,
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
    it('is called before request', done => {
      const before = jest.fn(({ payload, next }) => {
        expect(callback).not.toBeCalled()
        next(payload)
      })
      const callback = jest.fn(({ payload, resolve }) => {
        expect(before).toBeCalled()
        resolve(payload)
      })

      apicase({ callback })({ a: 1, hooks: { before } }).on('resolve', res => {
        done()
      })
    })

    it('updates payload before adapter call', done => {
      const before = jest.fn(({ payload, next }) =>
        next({
          ...payload,
          a: payload.a + 1
        })
      )
      const callback = jest.fn(({ payload, resolve }) => {
        expect(payload).toEqual({ a: 2, b: 1 })
        resolve(payload)
      })
      const payload = { a: 1, b: 1, hooks: { before } }
      apicase({ callback })(payload).on('resolve', () => {
        done()
      })
    })

    it('resolves/rejects request without adapter call', done => {
      const success = jest.fn(({ payload, resolve }) => resolve(payload))
      const fail = jest.fn(({ payload, reject }) => reject(payload))
      const callback = jest.fn(({ payload, resolve }) => resolve(payload))

      const doReq = apicase({ callback })

      doReq({ a: 1, hooks: { before: success } }).on('resolve', res => {
        expect(res).toEqual({ a: 1 })
        doReq({ a: 2, hooks: { before: fail } }).on('reject', res => {
          expect(res).toEqual({ a: 2 })
          expect(callback).not.toBeCalled()
          done()
        })
      })
    })
  })

  describe('Resolve hooks', () => {
    it('is called on request resolve', done => {
      const resolve = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(resolveAdapter)({ a: 1, hooks: { resolve } }).on(
        'resolve',
        res => {
          expect(res).toEqual({ a: 2 })
          expect(resolve).toBeCalled()
          done()
        }
      )
    })

    it('is not called on request reject', done => {
      const resolve = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(rejectAdapter)({ a: 1, hooks: { resolve } }).on('reject', res => {
        expect(res).toEqual({ a: 1 })
        expect(resolve).not.toBeCalled()
        done()
      })
    })

    it('can reject call', done => {
      const resolve = jest.fn(({ payload, reject }) => reject({ a: 2 }))
      const reject = jest.fn(({ payload, next }) => next({ a: 3 }))
      const payload = { a: 1, hooks: { resolve, reject } }

      apicase(resolveAdapter)(payload).on('reject', res => {
        expect(res).toEqual({ a: 3 })
        expect(resolve).toBeCalled()
        expect(reject).toBeCalled()
        done()
      })
    })
  })

  describe('Reject hooks', () => {
    it('is called on request reject', done => {
      const reject = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(rejectAdapter)({ a: 1, hooks: { reject } }).on('reject', res => {
        expect(res).toEqual({ a: 2 })
        expect(reject).toBeCalled()
        done()
      })
    })

    it('is not called on request resolve', done => {
      const reject = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(resolveAdapter)({ a: 1, hooks: { reject } }).on(
        'resolve',
        res => {
          expect(res).toEqual({ a: 1 })
          expect(reject).not.toBeCalled()
          done()
        }
      )
    })

    it('can resolve call', done => {
      const reject = jest.fn(({ payload, resolve }) => resolve({ a: 2 }))
      const resolve = jest.fn(({ payload, next }) => next({ a: 3 }))
      const payload = { a: 1, hooks: { resolve, reject } }

      apicase(rejectAdapter)(payload).on('resolve', res => {
        expect(res).toEqual({ a: 3 })
        expect(resolve).toBeCalled()
        expect(reject).toBeCalled()
        done()
      })
    })
  })
})

describe('Events', () => {
  it('emits finish event on request finish', async done => {
    const finishA = jest.fn(payload => expect(payload).toEqual({ a: 1 }))
    const finishB = jest.fn(payload => expect(payload).toEqual({ a: 1 }))

    await apicase(resolveAdapter)({ a: 1 }).on('finish', finishA)
    await apicase(rejectAdapter)({ a: 1 }).on('finish', finishB)
    expect(finishA).toBeCalled()
    expect(finishB).toBeCalled()
    done()
  })

  it('emits cancel event on request cancel', async done => {
    const cancel = jest.fn(() => {})
    const callback = ({ setCancelCallback, payload, resolve }) => {
      setCancelCallback(cancel)
      setTimeout(resolve, 500, payload)
    }

    const a = apicase({ callback })({ a: 1 }).on('cancel', cancel)
    await a.cancel()
    expect(cancel).toBeCalled()
    done()
  })

  it('emits resolve event on adapter resolve', async done => {
    const resolve = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })

    await apicase(resolveAdapter)({ a: 1 }).on('resolve', resolve)
    expect(resolve).toBeCalled()
    await apicase(rejectAdapter)({ a: 1 }).on('resolve', resolve)
    expect(resolve).toHaveBeenCalledTimes(1)
    done()
  })

  it('emits reject event on adapter resolve', async done => {
    const reject = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })

    await apicase(rejectAdapter)({ a: 1 }).on('reject', reject)
    expect(reject).toBeCalled()
    await apicase(resolveAdapter)({ a: 1 }).on('reject', reject)
    expect(reject).toHaveBeenCalledTimes(1)
    done()
  })

  it('emits change:state event on state change', () => {})

  it('emits change:payload event on payload change', () => {})

  it('emits change:result event on result change', () => {})
})

describe('State', () => {
  describe('success', () => {})

  describe('pending', () => {})

  describe('started', () => {})

  describe('payload', () => {})

  describe('result', () => {})
})
