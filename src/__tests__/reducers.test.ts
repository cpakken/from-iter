import { find, fromIter, groupBy, sum } from '..'

describe('utility reducers', () => {
  const numbers = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  test('groupBy', () => {
    const grouped = numbers.map((x) => x + 2)(groupBy((x) => (x % 2 === 0 ? 'even' : 'odd')))

    expect(grouped).toEqual({
      odd: [3, 5, 7, 9, 11],
      even: [4, 6, 8, 10, 12],
    })
  })

  test('find', () => {
    const found = numbers(find((x) => x > 5))
    expect(found).toBe(6)
  })

  test('sum', () => {
    const total = numbers(sum())
    expect(total).toBe(55)
  })
})
