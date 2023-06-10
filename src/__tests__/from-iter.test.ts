import { Mock } from 'vitest'
import { fromIter, iter, path, toObject } from '..'

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

    const generator = list.map((x) => x * 2).values()

    expect(Array.from(generator)).toEqual(numbers.map((x) => x * 2))
  })
})

describe('IterObject', () => {
  const object = { foo: 'bar', baz: 'qux' }

  test('map', () => {
    const list = fromIter(object)

    const result = list.map((value, key) => key.concat(value))

    const resArray = result.toArray()
    expect(resArray).toEqual(['foobar', 'bazqux'])

    const resObj = result.toObject()
    expect(resObj).toEqual({ foo: 'foobar', baz: 'bazqux' })

    // const resObjMapped = result.toObject(() => 3)
  })

  test('values()', () => {
    const generator = fromIter(object)
      .map((value, key) => key.concat(value))
      .values()

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

  const spy1 = vi.fn()
  const spy2 = vi.fn()
  const spy3 = vi.fn()

  const a = fromIter(Array.from({ length: 20 }))
    .map(mapKeys)
    .spy(spy1)
    .mapReduce(addPrev, 0)
    .filter(filterEven)
    .spy(spy2)
    .take(takeWhile)
    .spy(spy3)
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

    expect(spy1).toBeCalledTimes(16)
    expect(spy2).toBeCalledTimes(8)
    expect(spy3).toBeCalledTimes(7)
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

describe('toCollection', () => {
  const numbers = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).filter((x) => x % 2 === 0)

  test('array', () => {
    const store = numbers.toArray()
    expect(store).toMatchInlineSnapshot(`
      [
        2,
        4,
        6,
        8,
        10,
      ]
    `)
  })

  test('set', () => {
    const store = numbers.toSet()
    expect(store).toMatchInlineSnapshot(`
      Set {
        2,
        4,
        6,
        8,
        10,
      }
    `)
  })

  test('object', () => {
    const store = numbers.toObject()
    expect(store).toMatchInlineSnapshot(`
      {
        "1": 2,
        "3": 4,
        "5": 6,
        "7": 8,
        "9": 10,
      }
    `)
  })

  test('object to object', () => {
    // const obj = { foo: { value: 3 }, baz: { value: 4 } } as { [key: string]: { value: number } }
    const obj = { foo: { value: 3 }, baz: { value: 4 } }

    const store = fromIter(obj)
      .pipe(path(['value']))
      .toObject()

    const store2 = iter(obj).pipe(path(['value']))(toObject())

    expect(store).toEqual({ foo: 3, baz: 4 })
    expect(store2).toEqual({ foo: 3, baz: 4 })
  })

  test('map', () => {
    const store = numbers.toMap()
    expect(store).toMatchInlineSnapshot(`
      Map {
        1 => 2,
        3 => 4,
        5 => 6,
        7 => 8,
        9 => 10,
      }
    `)

    const store2 = numbers.toMap((x) => x + '!')
  })
})
