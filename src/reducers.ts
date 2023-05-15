import { AnyPath, Flatten, ObjectKey, Processor, TypeOfPath, filter, take } from './internal'

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

  //take(1) is put into priority chain (shifted in first position)
  return [[(_prev, val) => val], [filter(fn)], [take(1)]]
}

export const findKey = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, K> => {
  return [[(_prev, _val, key) => key], [filter(fn)], [take(1)]]
}

export const forEach = <T, K>(fn: MapFn<T, K, any>): Processor<T, K, void> => {
  return [[(_prev, val, key, index) => fn(val, key, index)]]
}

type Sum = {
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

export const pathOr = <T, K extends string | number, const Path extends AnyPath, const D>(
  path: Path,
  defaultValue?: D
): Processor<T, K, TypeOfPath<T, Path, D>> => {
  return [
    [
      (_acc, val) => {
        let result: any = val
        for (const key of path) {
          if (result == null) return defaultValue
          result = result[key]
        }
        return result == null ? defaultValue : result
      },
    ],
  ]
}

export const pick = <T, K extends string | number, const Keys extends readonly (keyof T)[]>(
  ...keys: Keys
): Processor<T, K, Flatten<Pick<T, Keys[number]>>> => {
  return [
    [
      (_acc, val): any => {
        const result = {} as Pick<T, Keys[number]>
        for (const key of keys) {
          result[key] = val[key]
        }
        return result
      },
    ],
  ]
}

//TODO deepMerge
//https://github.com/TehShrike/deepmerge/blob/master/index.js
