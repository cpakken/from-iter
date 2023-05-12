import { map, filter, iter, toArray, createPipe } from '..'

test('createPipe', () => {
  const pipe = createPipe(
    filter((x: number) => x % 2 === 0),
    map((x) => x * 2)
  )
  const numbers = iter([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const result = pipe(numbers)(toArray())
  expect(result).toEqual([4, 8, 12, 16])
})
