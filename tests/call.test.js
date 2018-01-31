import apicase from '../lib/call'

jest.setTimeout(1000)

describe('Adapters', () => {
  it('is called', done => {
    const callback = jest.fn().mockImplementation(({ resolve }) => resolve())

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
    const callback = ({ payload, resolve, reject }) => {
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

  it('converts payload if has convert option', done => {
    apicase({
      adapter: {
        callback: ({ payload, resolve }) => {
          expect(payload).toBe(2)
          done()
        },
        convert: payload => payload + 1
      },
      payload: 1
    })
  })

  it('resolves with data', done => {
    const callback = ({ payload, resolve }) =>
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
    const callback = ({ payload, reject }) =>
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
        callback: ({ payload, resolve }) => resolve(payload + 1)
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
        .mockImplementation(({ payload, next }) => next(payload + 1))

      apicase({
        adapter: {
          callback: ({ payload, resolve }) => resolve(payload)
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
        .mockImplementation(({ payload, next }) => next(payload + 1))

      apicase({
        adapter: {
          callback: ({ payload, resolve }) => resolve(payload)
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
        .mockImplementation(({ payload, next }) => next(payload + 1))

      apicase({
        adapter: {
          callback: ({ payload, reject }) => reject(payload)
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
          callback: ({ payload, resolve }) => resolve(payload)
        },
        payload: 1,
        hooks: {
          before: [
            ({ payload, next, resolve, reject }) => {
              expect(payload).toBe(1)
              expect(typeof next).toBe('function')
              expect(typeof resolve).toBe('function')
              expect(typeof reject).toBe('function')
              return next(payload)
            }
          ]
        }
      }).then(() => {
        done()
      })
    })

    it('resolve hook accepts response, next/reject callbacks', done => {
      apicase({
        adapter: {
          callback: ({ payload, resolve }) => resolve(payload)
        },
        payload: 1,
        hooks: {
          resolve: [
            ({ payload, next, reject }) => {
              expect(payload).toBe(1)
              expect(typeof next).toBe('function')
              expect(typeof reject).toBe('function')
              return next(payload)
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
          callback: ({ payload, reject }) => reject(payload)
        },
        payload: 1,
        hooks: {
          reject: [
            ({ payload, next, resolve }) => {
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
      it('resolves promise on resolve()', done => {
        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(2)
          },
          payload: 1,
          hooks: {
            before: [({ payload, resolve }) => resolve(3)]
          }
        }).then(res => {
          expect(res).toBe(3)
          done()
        })
      })

      it('rejects promise on reject()', done => {
        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(2)
          },
          payload: 1,
          hooks: {
            before: [({ payload, reject }) => reject(3)]
          }
        }).catch(res => {
          expect(res).toBe(3)
          done()
        })
      })

      it('does not call adapter on resolve()', done => {
        const callback = jest
          .fn()
          .mockImplementation(({ payload, resolve }) => resolve(2))

        apicase({
          adapter: {
            callback
          },
          payload: 1,
          hooks: {
            before: [({ payload, resolve }) => resolve(3)]
          }
        }).then(res => {
          expect(callback).not.toBeCalled()
          done()
        })
      })

      it('does not call adapter on reject()', done => {
        const callback = jest
          .fn()
          .mockImplementation(({ payload, resolve }) => resolve(2))

        apicase({
          adapter: {
            callback
          },
          payload: 1,
          hooks: {
            before: [({ payload, reject }) => resolve(3)]
          }
        }).catch(res => {
          expect(callback).not.toBeCalled()
          done()
        })
      })

      it('does not call resolve hooks with meta { skipHooks: true }', done => {
        const hook = jest
          .fn()
          .mockImplementation(({ payload, next }) => next(payload + 1))

        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: 1,
          hooks: {
            before: [({ payload, resolve }) => resolve(3, { skipHooks: true })],
            resolve: [hook]
          }
        }).then(res => {
          expect(hook).not.toBeCalled()
          done()
        })
      })

      it('does not call reject hooks with meta { skipHooks: true }', done => {
        const hook = jest
          .fn()
          .mockImplementation(({ payload, next }) => next(payload + 1))

        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: 1,
          hooks: {
            before: [({ payload, reject }) => reject(3, { skipHooks: true })],
            reject: [hook]
          }
        }).catch(res => {
          expect(hook).not.toBeCalled()
          done()
        })
      })
    })

    describe('resolve', () => {
      it('rejects promise on reject() and does not call reject hooks', done => {
        const hook = jest
          .fn()
          .mockImplementation(({ payload, next }) => next('lol'))

        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: 1,
          hooks: {
            resolve: [({ payload, reject }) => reject('hook')],
            reject: [hook]
          }
        }).catch(res => {
          expect(res).toBe('hook')
          expect(hook).not.toBeCalled()
          done()
        })
      })
    })

    describe('reject', () => {
      it('resolves promise on resolve call and does not call resolve hooks', done => {
        const hook = jest
          .fn()
          .mockImplementation(({ payload, next }) => next('lol'))

        apicase({
          adapter: {
            callback: ({ payload, reject }) => reject(payload)
          },
          payload: 1,
          hooks: {
            reject: [({ payload, resolve }) => resolve('hook')],
            resolve: [hook]
          }
        }).then(res => {
          expect(res).toBe('hook')
          expect(hook).not.toBeCalled()
          done()
        })
      })
    })
  })

  describe('queues', () => {
    describe('before', () => {
      it('calls queue of hooks using next() callback', done => {
        const cbs = new Array(5)
          .fill(null)
          .map((v, i) =>
            jest.fn().mockImplementation(({ payload, next }) => next(i))
          )

        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: -1,
          hooks: {
            before: cbs
          }
        }).then(res => {
          expect(res).toBe(4)
          cbs.forEach(cb => expect(cb).toBeCalled())
          done()
        })
      })
    })

    describe('resolve', () => {
      it('calls queue of hooks using next() callback', done => {
        const cbs = new Array(5)
          .fill(null)
          .map((v, i) =>
            jest.fn().mockImplementation(({ payload, next }) => next(i))
          )

        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: -1,
          hooks: {
            resolve: cbs
          }
        }).then(res => {
          expect(res).toBe(4)
          cbs.forEach(cb => expect(cb).toBeCalled())
          done()
        })
      })

      it('breaks queue on reject()', done => {
        const cb1 = jest
          .fn()
          .mockImplementation(({ payload, reject }) => reject('hook'))
        const cb2 = jest
          .fn()
          .mockImplementation(({ payload, next }) => next('lol'))
        apicase({
          adapter: {
            callback: ({ payload, resolve }) => resolve(payload)
          },
          payload: -1,
          hooks: {
            resolve: [cb1, cb2]
          }
        }).catch(res => {
          expect(cb1).toBeCalled()
          expect(res).toBe('hook')
          expect(cb2).not.toBeCalled()
          done()
        })
      })
    })

    describe('reject', () => {
      it('calls queue of hooks using next() callback', done => {
        const cbs = new Array(5)
          .fill(null)
          .map((v, i) =>
            jest.fn().mockImplementation(({ payload, next }) => next(i))
          )

        apicase({
          adapter: {
            callback: ({ payload, reject }) => reject(payload)
          },
          payload: -1,
          hooks: {
            reject: cbs
          }
        }).catch(res => {
          expect(res).toBe(4)
          cbs.forEach(cb => expect(cb).toBeCalled())
          done()
        })
      })

      it('breaks queue on resolve()', done => {
        const cb1 = jest
          .fn()
          .mockImplementation(({ payload, resolve }) => resolve('hook'))
        const cb2 = jest
          .fn()
          .mockImplementation(({ payload, next }) => next('lol'))
        apicase({
          adapter: {
            callback: ({ payload, reject }) => reject(payload)
          },
          payload: -1,
          hooks: {
            reject: [cb1, cb2]
          }
        }).then(res => {
          expect(cb1).toBeCalled()
          expect(res).toBe('hook')
          expect(cb2).not.toBeCalled()
          done()
        })
      })
    })
  })
})
