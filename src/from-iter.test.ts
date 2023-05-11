import { Mock } from 'vitest'
import { fromIter } from './from-iter'
import { groupBy } from './reducers'

const getMockResults = (mock: Mock) => mock.mock.results.map((r) => r.value)

describe('IterList', () => {
  const numbers = Array.from({ length: 10 }).map((_, i) => i)

  test('map', () => {
    const list = fromIter(numbers)

    const mapped = list.map((value, key) => ({ value, key }))

    const array = mapped.toArray()

    expect(array).toMatchSnapshot()
  })

  test('values()', () => {
    const list = fromIter(numbers)

    const generator = list.values((x) => x * 2)

    expect(Array.from(generator)).toEqual(numbers.map((x) => x * 2))
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

  test('values()', () => {
    const generator = fromIter(object).values((value, key) => key.concat(value))

    expect(Array.from(generator)).toEqual(['foobar', 'bazqux'])
  })
})

describe('Combination', () => {
  test('list', () => {
    const a = [1, 2, 3]
    const b = [4, 5, 6]

    const list = fromIter(a, b).toArray()
    expect(list).toEqual([1, 2, 3, 4, 5, 6])
  })
  test('object', () => {
    const a = { foo: 'bar' }
    const b = { baz: 'qux' }

    const list = fromIter(a, b).toObject()
    expect(list).toEqual({ foo: 'bar', baz: 'qux' })
  })
  test('hybrid', () => {
    const a = [1, 2, 3]
    const b = { foo: 'bar' }

    const list = fromIter(a, b).toArray()
    expect(list).toEqual([1, 2, 3, 'bar'])
  })
})

describe('kitchen sink', () => {
  const mapKeys = vi.fn((_value, key: number) => key)

  const addPrev = vi.fn((prev: number, current: number) => prev + current)

  const filterEven = vi.fn((value) => value % 2 === 0)

  const takeWhile = vi.fn((value: number) => value < 100)

  const mapResults = vi.fn((value: number, key: number, index: number) => ({ value, key, index }))

  const forEach1 = vi.fn()
  const forEach2 = vi.fn()
  const forEach3 = vi.fn()

  const a = fromIter(Array.from({ length: 20 }))
    .map(mapKeys)
    .forEach(forEach1)
    .mapReduce(addPrev, 0)
    .filter(filterEven)
    .forEach(forEach2)
    .take(takeWhile)
    .forEach(forEach3)
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

    expect(forEach1).toBeCalledTimes(16)
    expect(forEach2).toBeCalledTimes(8)
    expect(forEach3).toBeCalledTimes(7)
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

describe('utility reducers', () => {
  test('groupBy', () => {
    const grouped = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      .map((x) => x + 2)
      .to(groupBy((x) => (x % 2 === 0 ? 'even' : 'odd')))

    expect(grouped).toEqual({
      odd: [3, 5, 7, 9, 11],
      even: [4, 6, 8, 10, 12],
    })
  })
})
