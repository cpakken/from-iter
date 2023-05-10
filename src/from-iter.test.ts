import { Mock } from 'vitest'
import { fromIter } from './from-iter'

const getMockResults = (mock: Mock) => mock.mock.results.map((r) => r.value)

describe('IterList', () => {
  const numbers = Array.from({ length: 10 }).map((_, i) => i)

  test('map', () => {
    const list = fromIter(numbers)

    const mapped = list.map((value, key) => ({ value, key }))

    const array = mapped.toArray()

    expect(array).toMatchSnapshot()
  })
})

describe('IterObject', () => {
  const object = { foo: 'bar', baz: 'qux' }

  test('map', () => {
    const list = fromIter(object)

    const result = list.map((value, key) => key.concat(value))

    expect(result.toArray()).toEqual(['foobar', 'bazqux'])

    expect(result.toObject()).toEqual({ foo: 'foobar', baz: 'bazqux' })
  })
})

describe('kitchen sink', () => {
  const mapKeys = vi.fn((_value, key: number) => key)

  const addPrev = vi.fn((prev: number, current: number) => prev + current)

  const filterEven = vi.fn((value) => value % 2 === 0)

  const stopAt = vi.fn((value: number) => value > 100)

  const mapResults = vi.fn((value: number, key: number, index: number) => ({ value, key, index }))

  const a = fromIter(Array.from({ length: 20 }))
    .map(mapKeys)
    .mapReduce(addPrev, 0)
    .filter(filterEven)
    .until(stopAt)
    .map(mapResults)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('toArray', () => {
    const list = a.toArray()
    expect(list).toMatchSnapshot()

    expect(getMockResults(mapKeys)).toEqual(Array.from({ length: 16 }).map((_, i) => i))
    expect(getMockResults(addPrev)).toMatchSnapshot()
    expect(getMockResults(filterEven)).toMatchSnapshot()
  })

  test('reduce', () => {
    const result = a.reduce((acc, { value, key }) => ((acc[key] = value), acc), {} as any)

    expect(result).toMatchInlineSnapshot(`
      {
        "0": 0,
        "11": 66,
        "12": 78,
        "3": 6,
        "4": 10,
        "7": 28,
        "8": 36,
      }
    `)
  })
})
