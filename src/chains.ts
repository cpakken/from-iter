import {
  C_FILTER,
  C_FLATMAP,
  C_MAP,
  C_MAP_REDUCE,
  C_STOP,
  T_FILTER_CHAIN,
  T_FLATMAP_CHAIN,
  T_MAP_CHAIN,
  T_MAP_REDUCE_CHAIN,
  T_STOP_CHAIN,
} from './types'

export const filter = <T, K>(fn: T_FILTER_CHAIN<T, K>[1]): T_FILTER_CHAIN<T, K> => {
  return [C_FILTER, fn]
}

export const map = <T, K, R>(fn: T_MAP_CHAIN<T, K, R>[1]): T_MAP_CHAIN<T, K, R> => {
  return [C_MAP, fn]
}

export const flatmap = <T, K, R>(
  fn: T_FLATMAP_CHAIN<T, K, R>[1],
  level: number
): T_FLATMAP_CHAIN<T, K, R> => {
  return [C_FLATMAP, fn, level]
}

export const mapReduce = <T, K, A>(
  fn: T_MAP_REDUCE_CHAIN<T, K, A>[1],
  initial?: A
): T_MAP_REDUCE_CHAIN<T, K, A> => {
  return [C_MAP_REDUCE, fn, initial]
}

export const take = <T, K>(fnOrNum: number | T_STOP_CHAIN<T, K>[1]): T_STOP_CHAIN<T, K> => {
  //@ts-ignore
  return [C_STOP, isNaN(fnOrNum) ? fnOrNum : (val, key, index) => index < fnOrNum]
}

export const spy = <T, K>(fn: (val: T, key: K, index: number) => void): T_MAP_CHAIN<T, K, T> => {
  return [C_MAP, (val: T, key: K, index: number) => (fn(val, key, index), val)]
}
