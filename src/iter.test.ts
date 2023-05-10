import { Mock } from 'vitest'
import { iter } from './iter'

const getMockResults = (mock: Mock) => mock.mock.results.map((r) => r.value)

describe('kitchen sink', () => {
  const mapKeys = vi.fn((_value, key: number) => key)

  const addPrev = vi.fn((prev: number, current: number) => prev + current)

  const filterEven = vi.fn((value) => value % 2 === 0)

  const stopAt = vi.fn((value: number) => value > 100)

  const mapResults = vi.fn((value: number, key: number, index: number) => ({ value, key, index }))

  const a = iter(Array.from({ length: 20 }))
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
