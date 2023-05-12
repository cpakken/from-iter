import { filter, iter, map, toArray } from '..'

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
})
