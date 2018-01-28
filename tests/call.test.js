import apicase from '../lib/call'

describe('Adapters', () => {
  it('adapter is called', done => {
    const callback = jest.fn().mockImplementation((_, { resolve }) => resolve())

    apicase({
      adapter: {
        callback
      }
    }).then(() => {
      expect(callback).toBeCalled()
      done()
    })
  })

  it('adapter accepts correct payload and has callbacks', done => {
    const callback = (payload, { resolve, reject }) => {
      expect(payload).toBe(2)
      expect(typeof resolve).toBe('function')
      expect(typeof reject).toBe('function')
      return resolve(payload)
    }

    apicase({
      adapter: { callback },
      payload: 2
    }).then(() => {
      done()
    })
  })

  it('resolves with data', done => {
    const callback = (payload, { resolve }) =>
      setTimeout(resolve, 200, payload + 1)

    apicase({
      adapter: { callback },
      payload: 2
    }).then(res => {
      expect(res).toBe(3)
      done()
    })
  })

  it('rejects with data', done => {
    const callback = (payload, { reject }) =>
      setTimeout(reject, 200, payload + 1)

    apicase({
      adapter: { callback },
      payload: 2
    }).catch(res => {
      expect(res).toBe(3)
      done()
    })
  })

  it('works with global adapters', done => {
    apicase.addAdapters({
      resolve: {
        callback: (payload, { resolve }) => resolve(payload + 1)
      }
    })
    apicase({
      adapter: 'resolve',
      payload: 2
    }).then(res => {
      expect(res).toBe(3)
      done()
    })
  })
})

describe('Hooks', () => {
  describe('resolve hooks', () => {
    it('calls resolve hooks on adapter resolve', () => {})
    it('accepts response, next/reject callbacks', () => {})
    it('rejects promise on reject call', () => {})
  })
  describe('reject hooks', () => {
    it('calls reject hooks on adapter reject', () => {})
    it('accepts error, next/resolve callbacks', () => {})
    it('resolves promise on resolve call', () => {})
  })
  describe('before hooks', () => {
    it('calls before hooks', () => {})
    it('accepts payload, next/resolve/reject callbacks', () => {})
    it('resolves promise early after resolve call', () => {})
    it('rejects promise early after reject call', () => {})
    it('does not call resolve/reject hooks if meta.skipHooks is true', () => {})
  })
  describe('common', () => {
    it('calls queue of hooks', () => {})
    it('stops hooks queue on resolve/reject is called', () => {})
  })
})
