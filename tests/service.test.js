import apiService from '../lib/service'

describe('Service creation', () => {
  it('creates a service with partial passed payload', () => {
    const callback = (payload, { resolve }) => resolve(1)
    const payload = { a: 'test' }
    const hook = (payload, { resolve, reject }) => resolve(payload)

    const service = new apiService({
      adapter: {
        callback
      },
      payload,
      hooks: {
        before: [hook]
      }
    })
    expect(service.opts.adapter.callback).toBe(callback)
    expect(service.opts.payload).toBe(payload)
    expect(service.opts.hooks.before[0]).toBe(hook)
  })

  it('has .extend() and .call() methods', () => {
    const service = new apiService()
    expect(typeof service.call).toBe('function')
    expect(typeof service.extend).toBe('function')
  })
})

describe('using extend() method', () => {
  it('replaces adapter with newest one', () => {
    const cb1 = (payload, { resolve }) => resolve(1)
    const cb2 = (payload, { resolve }) => resolve(2)

    const service = new apiService({ adapter: { callback: cb1 } })
    const service2 = service.extend({ adapter: { callback: cb2 } })

    expect(service2.opts.adapter.callback).toBe(cb2)
  })

  it('replaces payload with the newest one', () => {
    const cb1 = (payload, { resolve }) => resolve(1)
    const cb2 = (payload, { resolve }) => resolve(2)

    const service = new apiService({ adapter: { callback: cb1 } })
    const service2 = service.extend({ adapter: { callback: cb2 } })

    expect(service2.opts.adapter.callback).toBe(cb2)
  })

  it('if adapter has `merge` callback, merges payloads with this callback', () => {
    const adapter = {
      callback: (payload, { resolve }) => resolve(payload),
      merge: (prev = 0, cur) => prev + cur
    }

    const service = new apiService({ adapter, payload: 1 })
    const service2 = service.extend({ payload: 2 })
    expect(service2.opts.payload).toBe(3)
  })

  it('concats hooks', () => {
    const hook1 = (payload, { next }) => next(1)
    const hook2 = (payload, { next }) => next(2)
    const hook3 = (payload, { next }) => next(3)
    const hook4 = (payload, { next }) => next(4)

    const service = new apiService({
      hooks: {
        before: [hook1],
        resolve: [hook2]
      }
    })

    const service2 = service.extend({
      hooks: {
        before: [hook3],
        reject: [hook4]
      }
    })

    expect(service2.opts.hooks).toEqual({
      before: [hook1, hook3],
      resolve: [hook2],
      reject: [hook4]
    })
  })
})

describe('using call() method', () => {
  it('merges service payload and passed in ', () => {
    const service = new apiService({
      adapter: {
        callback: (payload, { resolve }) => {
          expect(payload).toBe(3)
          resolve(payload)
        }
      },
      payload: 1,
      hooks: {
        resolve: [(next, { resolve }) => resolve('kek')]
      }
    })

    service
      .call({
        payload: 3,
        hooks: { resolve: [(payload, { resolve }) => payload + ' lol'] }
      })
      .then(res => {
        expect(res).toBe('kek lol')
        done()
      })
  })
})
