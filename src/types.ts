export const C_FILTER = 0
export const C_MAP = 1
export const C_MAP_REDUCE = 2
export const C_STOP = 3

export type T_FILTER = typeof C_FILTER
export type T_MAP = typeof C_MAP
export type T_MAP_REDUCE = typeof C_MAP_REDUCE
export type T_STOP = typeof C_STOP

export type TCHAIN = T_FILTER | T_MAP | T_MAP_REDUCE | T_STOP

export type T_FILTER_CHAIN<T, K> = readonly [T_FILTER, (val: T, key: K, index: number) => any]

export type T_STOP_CHAIN<T, K> = readonly [T_STOP, (val: T, key: K, index: number) => any]

export type T_MAP_CHAIN<T, K, R = any> = readonly [T_MAP, (val: T, key: K, index: number) => R]

export type T_MAP_REDUCE_CHAIN<T, K, A = any> = readonly [
  T_MAP_REDUCE,
  (acc: A, val: T, key: K, index: number) => A,
  A | undefined
]

export type IterChain<T = any, K = any> =
  | T_FILTER_CHAIN<T, K>
  | T_MAP_CHAIN<T, K>
  | T_MAP_REDUCE_CHAIN<T, K>
  | T_STOP_CHAIN<T, K>
export type CollecitonMapFns<T, K, K_, V> = {
  key?: (val: T, key: K, index: number) => K_
  value?: (val: T, key: K, index: number) => V
}

export type PrevResultStore<T, K> = WeakMap<T_MAP_REDUCE_CHAIN<T, K>[1], any>

export type IterateCallback<T, KEY extends string | number> = (result: T, key: KEY, index: number) => void
export type PipeState =
  | 1 // continue
  | 0 // skip
  | -1 // stop

export type IterCollection<T> = Iterable<T> | { [key: string]: T }
export type KeyOfIter<T> = T extends Iterable<any> ? number : keyof T
export type ValueOfIter<T> = T extends IterCollection<infer V> ? V : never

export type ChildOf<T> = T extends (infer V)[] ? V : never
