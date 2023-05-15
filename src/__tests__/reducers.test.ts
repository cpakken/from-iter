import { find, fromIter, groupBy } from '..'
import { pathOr, pick, sum } from '../reducers'

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

  test('pathOr', () => {
    const obj = {
      a: {
        b: {
          c: 1,
        },
      },
    }

    const a = fromIter([obj])(pathOr(['a']))
    expect(a).toEqual({ b: { c: 1 } })

    const ab = fromIter([obj])(pathOr(['a', 'b']))
    expect(ab).toEqual({ c: 1 })

    const abc = fromIter([obj])(pathOr(['a', 'b', 'c']))
    expect(abc).toBe(1)

    const abcd = fromIter([obj])(pathOr(['a', 'b', 'c', 'd'], 2))
    expect(abcd).toBe(2)
  })

  test('pick', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    }

    const picked = fromIter([obj])(pick('a', 'c'))
    expect(picked).toEqual({ a: 1, c: 3 })
  })
})
