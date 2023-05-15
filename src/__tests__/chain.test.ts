import { first, fromIter, path, pick } from '..'

describe('chain', () => {
  test.only('pathOr', () => {
    const obj = {
      a: {
        b: {
          c: 1,
        },
      },
    }

    const a = fromIter([obj]).pipe(path(['a']))(first())
    expect(a).toEqual({ b: { c: 1 } })

    const ab = fromIter([obj]).pipe(path(['a', 'b']))(first())
    expect(ab).toEqual({ c: 1 })

    const abc = fromIter([obj]).pipe(path(['a', 'b', 'c']))(first())
    expect(abc).toBe(1)

    const abcd = fromIter([obj]).pipe(path(['a', 'b', 'c', 'd'], 2))(first())
    expect(abcd).toBe(2)
  })

  test('pick', () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
    }

    const picked = fromIter([obj]).pipe(pick('a', 'c'))(first())
    expect(picked).toEqual({ a: 1, c: 3 })
  })
})
