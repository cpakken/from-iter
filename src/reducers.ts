type Reducer<T, K, A> = (acc: A, val: T, key: K, index: number) => A
export type Process<T, K, A> = [A, Reducer<T, K, A>]

type MapFn<T, K, R> = (val: T, key: K, index: number) => R
type Store<K extends string | number, V> = { [key in K]: V }

export const groupBy = <T, K extends string | number, R extends string | number>(
  fn: MapFn<T, K, R>
): Process<T, K, Store<R, T[]>> => {
  // ): [Store<R, T[]>, Reducer<T, K, Store<R, T[]>>] => {
  const initial = {} as Store<R, T[]>

  return [
    initial,
    (acc: Store<R, T[]>, val: T, key: K, index: number) => {
      const result = fn(val, key, index)
      const group = acc[result]
      if (group) {
        group.push(val)
      } else {
        acc[result] = [val]
      }
      return acc
    },
  ]
}
