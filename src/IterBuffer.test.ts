import { fromIter } from '.'

describe('IterBuffer', () => {
  test('without buffer', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    const spy3 = vi.fn()

    const list = fromIter([1, 2, 3, 4, 5, 6]).spy(spy1)

    list.forEach(spy2)
    list.forEach(spy3)

    expect(spy1).toBeCalledTimes(12)
    expect(spy2).toBeCalledTimes(6)
    expect(spy3).toBeCalledTimes(6)
  })

  test('with buffer', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    const spy3 = vi.fn()

    const list = fromIter([1, 2, 3, 4, 5, 6]).spy(spy1).buffer()

    //buffer() does not call spy because it lazy caches
    expect(spy1).toBeCalledTimes(0)

    list.forEach(spy2)
    list.forEach(spy3)

    expect(spy1).toBeCalledTimes(6)
    expect(spy2).toBeCalledTimes(6)
    expect(spy3).toBeCalledTimes(6)

    expect(spy1.mock.calls).toEqual(spy2.mock.calls)
    expect(spy1.mock.calls).toEqual(spy3.mock.calls)
  })

  test('with buffer call values().next out of order', () => {
    const spy1 = vi.fn()

    const list = fromIter([1, 2, 3, 4, 5, 6]).spy(spy1).buffer()

    const a = list.values()
    const b = list.values()

    a.next()
    b.next()

    a.next()
    b.next()

    a.next()
    b.next()

    expect(spy1).toBeCalledTimes(3)
  })
})
