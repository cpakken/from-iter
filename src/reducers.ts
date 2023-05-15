import { ObjectKey, Processor, filter, take } from './internal'

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

//TODO test??
export const pickBy = <T, K extends string | number>(fn: MapFn<T, K, any>): Processor<T, K, Store<K, T>> => {
  return [[(acc, val, key) => ((acc[key] = val), acc), () => ({} as Store<K, T>)], [filter(fn)]]
}

export const find = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, T | undefined> => {
  // return [[(_prev, val) => val], [take(1), filter(fn)]]

  //take(1) is put into priority chain (shifted in first position)
  return [[(_prev, val) => val], [filter(fn)], [take(1)]]
}

export const findKey = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, K> => {
  return [[(_prev, _val, key) => key], [filter(fn)], [take(1)]]
}

export const forEach = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, void> => {
  return [[(_prev, val, key, index) => fn(val, key, index)]]
}

export type Sum = {
  <K>(): Processor<number, K, number>
  <T, K>(fn: MapFn<T, K, number>): Processor<T, K, number>
}

export const sum: Sum = <T, K>(fn?: MapFn<T, K, number>): Processor<T, K, number> => {
  return [
    [
      fn
        ? (acc: number, val: T, key: K, index: number): number => (acc += fn(val, key, index))
        : (acc: number, val: T): number => (acc += val as any),
      () => 0,
    ],
  ]
}

export const first = <T, K>(): Processor<T, K, T> => {
  return [[(_prev, val) => val], [], [take(1)]]
}

//TODO deepMerge
//https://github.com/TehShrike/deepmerge/blob/master/index.js
