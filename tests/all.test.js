var callAll = require('../cjs/all')

it('applies apicase to all payloads and call all of them', done => {
  const cb1 = jest
    .fn()
    .mockImplementation(({ payload, resolve }) => resolve(payload.a))
  const cb2 = jest
    .fn()
    .mockImplementation(({ payload, resolve }) => resolve(payload.a))
  const cb3 = jest
    .fn()
    .mockImplementation(({ payload, resolve }) => resolve(payload.a))

  callAll([
    {
      adapter: { callback: cb1 },
      a: 1
    },
    {
      adapter: { callback: cb2 },
      a: 2
    },
    {
      adapter: { callback: cb3 },
      a: 3
    }
  ]).then(res => {
    expect(cb1).toBeCalled()
    expect(cb2).toBeCalled()
    expect(cb3).toBeCalled()
    done()
  })
})

it('returns all results (like Promise.all)', done => {
  callAll([
    {
      adapter: {
        callback: ({ payload, resolve }) => setTimeout(resolve, 300, payload.a)
      },
      a: 1
    },
    {
      adapter: {
        callback: ({ payload, resolve }) => setTimeout(resolve, 100, payload.a)
      },
      a: 2
    },
    {
      adapter: {
        callback: ({ payload, resolve }) => setTimeout(resolve, 200, payload.a)
      },
      a: 3
    }
  ]).then(res => {
    expect(res).toEqual([1, 2, 3])
    done()
  })
})

it('rejects when any call is rejected', done => {
  callAll([
    {
      adapter: {
        callback: ({ payload, resolve }) => resolve(1)
      }
    },
    {
      adapter: {
        callback: ({ payload, reject }) => reject(2)
      }
    },
    {
      adapter: {
        callback: ({ payload, resolve }) => resolve(3)
      }
    }
  ]).catch(err => {
    expect(err).toBe(2)
    done()
  })
})
