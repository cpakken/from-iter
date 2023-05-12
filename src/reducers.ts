import { ObjectKey, Processor, filter, take } from '.'

export type MapFn<T, K, R> = (val: T, key: K, index: number) => R
export type Store<K extends ObjectKey, V> = { [key in K]: V }

export const groupBy = <T, K extends string | number, R extends string | number>(
  fn: MapFn<T, K, R>
): Processor<T, K, Store<R, T[]>> => {
  // const initial = {} as Store<R, T[]>

  const _groupBy = (acc: Store<R, T[]>, val: T, key: K, index: number) => {
    const result = fn(val, key, index)
    const group = acc[result]
    if (group) {
      group.push(val)
    } else {
      acc[result] = [val]
    }
    return acc
  }
  return [[_groupBy, () => ({} as Store<R, T[]>)]]
}

export const pickBy = <T, K extends string | number>(fn: MapFn<T, K, any>): Processor<T, K, Store<K, T>> => {
  return [[(acc, val, key) => ((acc[key] = val), acc), () => ({} as Store<K, T>)], [filter(fn)]]
}

export const find = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, T | undefined> => {
  // return [[(_prev, val) => val], [take(1), filter(fn)]]
  return [[(_prev, val) => val], [filter(fn)], [take(1)]]
}
