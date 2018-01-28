import apicase from '../lib/call'

jest.setTimeout(1000)

describe('Adapters', () => {
  it('is called', done => {
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

  it('accepts correct payload and has callbacks', done => {
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

  it('converts payload if has convert option', done => {})

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
  describe('calling hooks', () => {
    it('calls before hooks before call', done => {
      const hook = jest
        .fn()
        .mockImplementation((res, { next }) => next(res + 1))
      apicase({
        adapter: {
          callback: (payload, { resolve }) => resolve(payload)
        },
        payload: 1,
        hooks: {
          before: [hook]
        }
      }).then(() => {
        expect(hook).toBeCalled()
        done()
      })
    })
    it('calls resolve hooks on adapter resolve', done => {
      const hook = jest
        .fn()
        .mockImplementation((res, { next }) => next(res + 1))
      apicase({
        adapter: {
          callback: (payload, { resolve }) => resolve(payload)
        },
        payload: 1,
        hooks: {
          resolve: [hook]
        }
      }).then(() => {
        expect(hook).toBeCalled()
        done()
      })
    })
    it('calls reject hooks on adapter reject', done => {
      const hook = jest
        .fn()
        .mockImplementation((res, { next }) => next(res + 1))
      apicase({
        adapter: {
          callback: (payload, { reject }) => reject(payload)
        },
        payload: 1,
        hooks: {
          reject: [hook]
        }
      }).catch(() => {
        expect(hook).toBeCalled()
        done()
      })
    })
  })

  describe('hooks arguments', () => {
    it('before hook accepts payload, next/resolve/reject callbacks', done => {
      apicase({
        adapter: {
          callback: (payload, { resolve }) => resolve(payload),
          payload: 1,
          hooks: {
            before: [
              (payload, { next, resolve, reject }) => {
                expect(response).toBe(1)
                expect(typeof next).toBe('function')
                expect(typeof resolve).toBe('function')
                expect(typeof reject).toBe('function')
                return next(response)
              }
            ]
          }
        }
      }).then(() => {
        done()
      })
    })
    it('resolve hook accepts response, next/reject callbacks', done => {
      apicase({
        adapter: {
          callback: (payload, { resolve }) => resolve(payload)
        },
        payload: 1,
        hooks: {
          resolve: [
            (response, { next, reject }) => {
              expect(response).toBe(1)
              expect(typeof next).toBe('function')
              expect(typeof reject).toBe('function')
              return next(response)
            }
          ]
        }
      }).then(() => {
        done()
      })
    })
    it('reject hook accepts error, next/resolve callbacks', done => {
      apicase({
        adapter: {
          callback: (payload, { reject }) => reject(payload)
        },
        payload: 1,
        hooks: {
          reject: [
            (response, { next, resolve }) => {
              expect(response).toBe(1)
              expect(typeof next).toBe('function')
              expect(typeof resolve).toBe('function')
              return next(response)
            }
          ]
        }
      }).catch(() => {
        done()
      })
    })
  })

  describe('hooks callbacks', () => {
    describe('before', () => {
      it('resolves promise on resolve call', () => {})
      it('rejects promise on reject call', () => {})
      it('does not call adapter on resolve/reject call', () => {})
      it('does not call adapters with meta { skipHooks: true }', () => {})
    })

    describe('resolve', () => {
      it('rejects promise on reject call', done => {
        apicase({
          adapter: {
            callback: (payload, { resolve }) => resolve(payload)
          },
          payload: 1,
          hooks: {
            resolve: [(response, { reject }) => reject(response)]
          }
        }).catch(res => {
          expect(res).toBe(1)
          done()
        })
      })
    })

    describe('reject', () => {
      it('resolves promise on resolve call', done => {
        apicase({
          adapter: {
            callback: (payload, { reject }) => reject(payload)
          },
          payload: 1,
          hooks: {
            reject: [(response, { resolve }) => resolve(response)]
          }
        }).then(res => {
          expect(res).toBe(1)
          done()
        })
      })
    })
  })

  // describe('queues', () => {})

  // describe('before hooks', () => {
  //   it('accepts payload, next/resolve/reject callbacks', () => {})
  //   it('resolves promise early after resolve call', () => {})
  //   it('rejects promise early after reject call', () => {})
  //   it('does not call resolve/reject hooks if meta.skipHooks is true', () => {})
  // })
  // describe('common', () => {
  //   it('calls queue of hooks', () => {})
  //   it('stops hooks queue on resolve/reject is called', () => {})
  // })
})
