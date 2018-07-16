import { pick } from 'nanoutils'
import { apicase } from '../lib/apicase'

const pickState = pick(['success', 'pending', 'cancelled', 'payload', 'result'])

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

    apicase({ callback })({ a: 1 }).on('done', res => {
      expect(callback).toBeCalled()
      done()
    })
  })

  it('returns thenable object with state, cancel() and on() methods', async done => {
    const res = apicase(resolveAdapter)({ a: 1 })
    expect(pickState(res)).toEqual({
      success: false,
      pending: true,
      cancelled: false,
      payload: { a: 1 },
      result: null
    })
    await res
    done()
  })
})

describe('Adapters', () => {
  it('has payload, result resolve and reject callbacks', done => {
    const callback = jest.fn(({ payload, result, resolve, reject }) => {
      expect(payload).toEqual({ a: 1 })
      expect(result).toBe(null)
      expect(typeof resolve).toBe('function')
      expect(typeof reject).toBe('function')
      resolve(payload)
    })

    apicase({ callback })({ a: 1 }).on('finish', res => {
      done()
    })
  })

  it('creates state if createState() callback provided', done => {
    const createState = () => ({ a: 1, b: 2 })
    const callback = jest.fn(({ payload, result, resolve }) => {
      expect(result).toEqual({ a: 1, b: 2 })
      setTimeout(resolve, 100, payload)
    })

    apicase({ callback, createState })({ a: 2 }).on('done', res => {
      done()
    })
  })

  // it('has setResult() callback to set new state', done => {
  //   const createState = () => ({ a: 1, b: 2 })
  //   const callback = jest.fn(({ payload, result, resolve, setResult }) => {
  //     setResult({ b: 3 })
  //     resolve(payload)
  //   })

  //   apicase({ callback, createState })({ a: 2 }).on('done', res => {
  //     expect(res).toEqual({ a: 2 })
  //     done()
  //   })
  // })

  it('converts payload before callback if convert() provided', done => {
    const convert = payload => ({ ...payload, a: 2 })
    const callback = jest.fn(({ payload, result, resolve, setResult }) => {
      expect(payload).toEqual({ a: 2, b: 3 })
      resolve(payload)
    })

    apicase({ callback, convert })({ b: 3 }).on('done', res => {
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
      .on('done', resolve)
      .on('cancel', cancel)

    call.cancel()
  })

  it('resolves request on resolve() call and rejects on reject()', done => {
    apicase(resolveAdapter)({ a: 1 }).on('done', res => {
      apicase(rejectAdapter)(res).on('fail', res => {
        expect(res).toEqual({ a: 1 })
        done()
      })
    })
  })
})

describe('Hooks', () => {
  describe('Before hooks', () => {
    it('is called before request', doneCb => {
      const before = jest.fn(({ payload, next }) => {
        expect(callback).not.toBeCalled()
        next(payload)
      })
      const callback = jest.fn(({ payload, resolve }) => {
        expect(before).toBeCalled()
        resolve(payload)
      })

      apicase({ callback })({ a: 1, hooks: { before } }).on('done', res => {
        doneCb()
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
      apicase({ callback })(payload).on('done', () => {
        done()
      })
    })

    it('resolves/rejects request without adapter call', done => {
      const success = jest.fn(({ payload, done }) => done(payload))
      const fail = jest.fn(({ payload, fail }) => fail(payload))
      const callback = jest.fn(({ payload, resolve }) => resolve(payload))

      const doReq = apicase({ callback })

      doReq({ a: 1, hooks: { before: success } }).on('done', res => {
        expect(res).toEqual({ a: 1 })
        doReq({ a: 2, hooks: { before: fail } }).on('fail', res => {
          expect(res).toEqual({ a: 2 })
          expect(callback).not.toBeCalled()
          done()
        })
      })
    })
  })

  describe('Done hooks', () => {
    it('is called on request done', doneCb => {
      const done = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(resolveAdapter)({ a: 1, hooks: { done } }).on('done', res => {
        expect(res).toEqual({ a: 2 })
        expect(done).toBeCalled()
        doneCb()
      })
    })

    it('is not called on request fail', doneCb => {
      const done = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(rejectAdapter)({ a: 1, hooks: { done } }).on('fail', res => {
        expect(res).toEqual({ a: 1 })
        expect(done).not.toBeCalled()
        doneCb()
      })
    })

    it('can fail call', doneCb => {
      const done = jest.fn(({ payload, fail }) => fail({ a: 2 }))
      const fail = jest.fn(({ payload, next }) => next({ a: 3 }))
      const payload = { a: 1, hooks: { done, fail } }

      apicase(resolveAdapter)(payload).on('fail', res => {
        expect(res).toEqual({ a: 3 })
        expect(done).toBeCalled()
        expect(fail).toBeCalled()
        doneCb()
      })
    })
  })

  describe('Fail hooks', () => {
    it('is called on request reject', doneCb => {
      const fail = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(rejectAdapter)({ a: 1, hooks: { fail } }).on('fail', res => {
        expect(res).toEqual({ a: 2 })
        expect(fail).toBeCalled()
        doneCb()
      })
    })

    it('is not called on request done', done => {
      const fail = jest.fn(({ payload, next }) => next({ a: 2 }))

      apicase(resolveAdapter)({ a: 1, hooks: { fail } }).on('done', res => {
        expect(res).toEqual({ a: 1 })
        expect(fail).not.toBeCalled()
        done()
      })
    })

    it('can done call', doneCb => {
      const fail = jest.fn(({ payload, done }) => done({ a: 2 }))
      const done = jest.fn(({ payload, next }) => next({ a: 3 }))
      const payload = { a: 1, hooks: { done, fail } }

      apicase(rejectAdapter)(payload).on('done', res => {
        expect(res).toEqual({ a: 3 })
        expect(done).toBeCalled()
        expect(fail).toBeCalled()
        doneCb()
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

  it('emits done event on adapter done', async doneCb => {
    const done1 = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })
    const done2 = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })

    await apicase(resolveAdapter)({ a: 1 }).on('done', done1)
    expect(done1).toBeCalled()
    await apicase(rejectAdapter)({ a: 1 }).on('done', done2)
    expect(done2).not.toBeCalled()
    doneCb()
  })

  it('emits fail event on adapter fail', async done => {
    const fail1 = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })
    const fail2 = jest.fn(result => {
      expect(result).toEqual({ a: 1 })
    })

    await apicase(rejectAdapter)({ a: 1 }).on('fail', fail1)
    expect(fail1).toBeCalled()
    await apicase(resolveAdapter)({ a: 1 }).on('fail', fail2)
    expect(fail2).not.toBeCalled()
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
