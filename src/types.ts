import type { IterLite } from './internal'

export const C_FILTER = 0
export const C_MAP = 1
export const C_MAP_REDUCE = 2
export const C_STOP = 3
export const C_FLATMAP = 4

export type T_FILTER = typeof C_FILTER
export type T_MAP = typeof C_MAP
export type T_MAP_REDUCE = typeof C_MAP_REDUCE
export type T_STOP = typeof C_STOP
export type T_FLATMAP = typeof C_FLATMAP

export type TCHAIN = T_FILTER | T_MAP | T_MAP_REDUCE | T_STOP | T_FLATMAP

//Buffered
export type T_FILTER_CHAIN<T, K> = readonly [T_FILTER, (val: T, key: K, index: number) => any]

export type T_STOP_CHAIN<T, K> = readonly [T_STOP, (val: T, key: K, index: number) => any]

//Mapped
export type T_MAP_CHAIN<T, K, R = any> = readonly [T_MAP, (val: T, key: K, index: number) => R]

export type T_FLATMAP_CHAIN<T, K, R = T> = readonly [
  type: T_FLATMAP,
  fn: (inner: [val: ValueOfIter<T>, key?: KeyOfIter<T>, index?: number], key: K, index: number) => R,
  level: number
]

export type T_MAP_REDUCE_CHAIN<T, K, A = any> = readonly [
  type: T_MAP_REDUCE,
  reducer: (acc: A, val: T, key: K, index: number) => A,
  initial: A | undefined
]

export type CN<T = any, K = any, R = any> =
  | T_MAP_CHAIN<T, K, R>
  | T_MAP_REDUCE_CHAIN<T, K, R>
  | T_FILTER_CHAIN<T, K>
  | T_STOP_CHAIN<T, K>
  | T_FLATMAP_CHAIN<T, K, R>

export type MapKeyFn<T, K, K_> = (val: T, key: K, index: number) => K_

export type Reducer<T, K, A> = (acc: A, val: T, key: K, index: number) => A

export type ReducerUnit<T, K, A> = [reducer: Reducer<T, K, A>, create?: () => A]

export type Processor<T, K, A, R = T> = [
  reducerUnit: ReducerUnit<R, K, A>,
  chains?: readonly CN[],
  priorityChains?: readonly CN[]
  // chains?: readonly [CN<T, K>, ...CN[]],
  // priorityChains?: readonly [CN<T, K>, ...CN[]]
]

export type PrevResultStore<T, K> = WeakMap<T_MAP_REDUCE_CHAIN<T, K>[1], any>

export type IterateCallback<T, KEY> = (result: T, key: KEY, index: number) => void
export type PipeState =
  | 2 // flatten
  | 1 // continue
  | 0 // skip
  | -1 // stop

export type ChainResult<T> =
  // | [state: 0 | -1]
  // | [state: 1, result: T]
  [state: PipeState, result?: T] | [state: 2, flatten: IterLite<ValueOfIter<T>, KeyOfIter<T>>]

//Utility types
export type IterCollection<T> = Iterable<T> | { [key: string]: T }

// export type KeyOfIter<T> = T extends Iterable<any> ? number : keyof T

//Since keyof {[key: string]: any} is string | number, we need to exclude number
export type KeyOfIter<T> = T extends Iterable<any>
  ? number
  : T extends { [key: string]: any }
  ? keyof T & string
  : never

export type ValueOfIter<T> = T extends IterCollection<infer V> ? V : never

export type ChildOfArray<T extends any[]> = T[number]

export type ObjectKey = string | number | symbol
export type IterResult<T, KEY> = readonly [T, KEY, number]

export type AnyPath = readonly (string | number)[]

export type TypeOfPath<T, PATH extends AnyPath, Default = never> = PATH extends readonly [infer K, ...infer R]
  ? K extends keyof T
    ? R extends readonly [string | number, ...AnyPath]
      ? TypeOfPath<T[K], R, Default>
      : T[K]
    : Default
  : Default

export type Flatten<T> = T extends {} ? { [K in keyof T]: T[K] } : T
