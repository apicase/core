import queue from '../lib/queue'

it('creates queue of apicase calls that are executed in turn', done => {
  const cb1 = jest.fn().mockImplementation(({ payload, resolve }) => {
    expect(cb2).not.toBeCalled()
    expect(cb3).not.toBeCalled()
    resolve(payload)
  })
  const cb2 = jest.fn().mockImplementation(({ payload, resolve }) => {
    expect(cb1).toBeCalled()
    expect(cb3).not.toBeCalled()
    resolve(payload)
  })
  const cb3 = jest.fn().mockImplementation(({ payload, resolve }) => {
    expect(cb1).toBeCalled()
    expect(cb2).toBeCalled()
    resolve(payload)
  })

  queue([
    { adapter: { callback: cb1 }, payload: 1 },
    { adapter: { callback: cb2 }, payload: 2 },
    { adapter: { callback: cb3 }, payload: 3 }
  ]).then(res => {
    expect(cb1).toBeCalled()
    expect(cb2).toBeCalled()
    expect(cb3).toBeCalled()
    done()
  })
})

it('returns result of the last call', done => {
  const cb1 = ({ payload, resolve }) => resolve(1)
  const cb2 = ({ payload, resolve }) => resolve(2)
  const cb3 = ({ payload, resolve }) => resolve(3)

  queue([
    { adapter: { callback: cb1 }, payload: 1 },
    { adapter: { callback: cb2 }, payload: 2 },
    { adapter: { callback: cb3 }, payload: 3 }
  ]).then(res => {
    expect(res).toBe(3)
    done()
  })
})

it('rejects promise with error when some call was rejected', done => {
  const cb1 = ({ payload, resolve }) => resolve(1)
  const cb2 = ({ payload, reject }) => reject(2)
  const cb3 = ({ payload, resolve }) => resolve(3)

  queue([
    { adapter: { callback: cb1 }, payload: 1 },
    { adapter: { callback: cb2 }, payload: 2 },
    { adapter: { callback: cb3 }, payload: 3 }
  ]).catch(res => {
    expect(res).toBe(2)
    done()
  })
})

it('if some payload is passed as a function, calls it with previous result', done => {
  const cb = ({ payload, resolve }) => resolve(payload)

  queue([
    { adapter: { callback: cb }, payload: 1 },
    prev => ({ adapter: { callback: cb }, payload: prev + 1 }),
    prev => ({ adapter: { callback: cb }, payload: prev + 1 })
  ]).then(res => {
    expect(res).toBe(3)
    done()
  })
})
