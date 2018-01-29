import callAll from '../lib/all'

it('applies apicase to all payloads and call all of them', done => {
  const cb1 = jest
    .fn()
    .mockImplementation((payload, { resolve }) => resolve(payload))
  const cb2 = jest
    .fn()
    .mockImplementation((payload, { resolve }) => resolve(payload))
  const cb3 = jest
    .fn()
    .mockImplementation((payload, { resolve }) => resolve(payload))

  callAll([
    {
      adapter: { callback: cb1 },
      payload: 1
    },
    {
      adapter: { callback: cb2 },
      payload: 2
    },
    {
      adapter: { callback: cb3 },
      payload: 3
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
        callback: (payload, { resolve }) => setTimeout(resolve, 3000, payload)
      },
      payload: 1
    },
    {
      adapter: {
        callback: (payload, { resolve }) => setTimeout(resolve, 1000, payload)
      },
      payload: 2
    },
    {
      adapter: {
        callback: (payload, { resolve }) => setTimeout(resolve, 2000, payload)
      },
      payload: 3
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
        callback: (payload, { resolve }) => resolve(1)
      }
    },
    {
      adapter: {
        callback: (payload, { reject }) => reject(2)
      }
    },
    {
      adapter: {
        callback: (payload, { resolve }) => resolve(3)
      }
    }
  ]).catch(err => {
    expect(err).toBe(2)
    done()
  })
})
