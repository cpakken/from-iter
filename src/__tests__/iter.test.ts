import { filter, iter, map, take, toArray } from '..'

describe('IterLite', () => {
  test('basic', () => {
    const a = iter([1, 2, 3, 4, 5, 6])

    const b = a.pipe(
      filter((x) => x % 2 === 0),
      map((x) => `${x * 2}`)
    )

    const c = b(toArray())

    expect(c).toEqual(['4', '8', '12'])
  })
  test('basic2', () => {
    const a = iter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    const b = a.pipe(
      map((x) => `${x * 2}`),
      filter((x) => x.length > 1),
      take(2)
    )

    const c = b(toArray())

    expect(c).toEqual(['10', '12'])
  })
})
