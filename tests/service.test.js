import ApiService from '../lib/service'

describe('Service creation', () => {
  it('creates a service with partial passed payload', () => {
    const callback = ({ payload, resolve }) => resolve(1)
    const payload = { a: 'test' }
    const hook = ({ payload, resolve, reject }) => resolve(payload)

    const service = new ApiService({
      adapter: {
        callback
      },
      payload,
      hooks: {
        before: [hook]
      }
    })
    expect(service.opts[0].adapter.callback).toBe(callback)
    expect(service.opts[0].payload).toBe(payload)
    expect(service.opts[0].hooks.before[0]).toBe(hook)
  })

  it('has .extend() and .call() methods', () => {
    const service = new ApiService()
    expect(typeof service.call).toBe('function')
    expect(typeof service.extend).toBe('function')
  })
})

describe('using extend() method', () => {
  it('returns new service instance', () => {
    const service = new ApiService({})
    const service2 = new ApiService({})
    expect(service).not.toBe(service2)
  })

  it('pushes next options to array of opts', () => {
    const payload1 = {
      payload: 1,
      hooks: { before: [console.log] }
    }
    const payload2 = {
      payload: 2,
      hooks: { success: [console.log] }
    }
    const service = new ApiService(payload1)
    const service2 = service.extend(payload2)

    expect(service.opts[0]).toBe(payload1)
    expect(service2.opts[1]).toBe(payload2)
  })
  // it('replaces adapter with newest one', () => {
  //   const cb1 = ({ payload, resolve }) => resolve(1)
  //   const cb2 = ({ payload, resolve }) => resolve(2)

  //   const service = new ApiService({ adapter: { callback: cb1 } })
  //   const service2 = service.extend({ adapter: { callback: cb2 } })

  //   expect(service2.opts[1].adapter.callback).toBe(cb2)
  // })

  // it('replaces payload with the newest one', () => {
  //   const cb1 = ({ payload, resolve }) => resolve(1)
  //   const cb2 = ({ payload, resolve }) => resolve(2)

  //   const service = new ApiService({ adapter: { callback: cb1 } })
  //   const service2 = service.extend({ adapter: { callback: cb2 } })

  //   expect(service2.opts[1].adapter.callback).toBe(cb2)
  // })

  // it('if adapter has `merge` callback, merges payloads with this callback', () => {
  //   const adapter = {
  //     callback: ({ payload, resolve }) => resolve(payload),
  //     merge: (prev = 0, cur) => prev + cur
  //   }

  //   const service = new ApiService({ adapter, payload: 1 })
  //   const service2 = service.extend({ payload: 2 })
  //   expect(service2.opts[1].payload).toBe(3)
  // })

  // it('concats hooks', () => {
  //   const hook1 = ({ payload, next }) => next(1)
  //   const hook2 = ({ payload, next }) => next(2)
  //   const hook3 = ({ payload, next }) => next(3)
  //   const hook4 = ({ payload, next }) => next(4)

  //   const service = new ApiService({
  //     hooks: {
  //       before: [hook1],
  //       resolve: [hook2]
  //     }
  //   })

  //   const service2 = service.extend({
  //     hooks: {
  //       before: [hook3],
  //       reject: [hook4]
  //     }
  //   })

  //   expect(service2.opts[1].hooks).toEqual({
  //     before: [hook1, hook3],
  //     resolve: [hook2],
  //     reject: [hook4]
  //   })
  // })
})

describe('using call() method', () => {
  it('merges service payload with passed in call() method', done => {
    const service = new ApiService({
      adapter: {
        callback: ({ payload, resolve }) => {
          expect(payload).toBe('foo')
          resolve(payload)
        }
      },
      payload: 1,
      hooks: {
        resolve: [({ payload, next }) => next(payload + ' bar')]
      }
    })

    service
      .call({
        payload: 'foo',
        hooks: { resolve: [({ payload, next }) => next(payload + ' baz')] }
      })
      .then(res => {
        expect(res).toBe('foo bar baz')
        done()
      })
  })
})
