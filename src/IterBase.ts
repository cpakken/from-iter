import { IterList, IterObject, IterObjectKey } from '.'

const C_FILTER = 0
const C_MAP = 1
const C_MAP_REDUCE = 2
const C_STOP = 3

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

type CollecitonMapFns<T, K, K_, V> = {
  key?: (val: T, key: K, index: number) => K_
  value?: (val: T, key: K, index: number) => V
}

export type PrevResultStore<T, K> = WeakMap<T_MAP_REDUCE_CHAIN<T, K>[1], any>

export type IterateCallback<T, KEY extends string | number> = (result: T, key: KEY, index: number) => void

type PipeState =
  | 1 // continue
  | 0 // skip
  | -1 // stop

export abstract class IterBase<T, KEY extends string | number> {
  constructor(iterator: Iterable<T>)
  constructor(
    iterator: Iterable<any>,
    chains: [...IterChain[], T_MAP_CHAIN<any, KEY, T> | T_MAP_REDUCE_CHAIN<any, KEY, T>]
  )
  constructor(iterator: Iterable<T>, chains: [...IterChain[], T_FILTER_CHAIN<T, KEY> | T_STOP_CHAIN<T, KEY>])

  constructor(protected _iterator: Iterable<any>, private _chains: IterChain[] = []) {}

  // protected abstract _iterate(callback: (result: T, key: KEY, index: number) => void): void
  protected abstract _iterate(callback: IterateCallback<T, KEY>): void

  protected _pipeItem(
    // callback: IterateCallback<T, KEY>,
    prevResultStore: PrevResultStore<T, KEY>,
    item: T,
    key: KEY,
    index: number
  ): [PipeState, T?] {
    let state: PipeState = 1 // 1 = continue, 0 = skip, -1 = stop
    let result = item

    for (const [type, fn, init] of this._chains) {
      switch (type) {
        case C_MAP:
          result = fn(result, key, index)
          break
        case C_FILTER:
          if (!fn(result, key, index)) state = 0
          break
        case C_MAP_REDUCE: {
          const prev = prevResultStore.has(fn)
            ? prevResultStore.get(fn)
            : (prevResultStore.set(fn, init), init)

          result = fn(prev, result, key, index)

          prevResultStore.set(fn, result)
          break
        }
        case C_STOP: {
          state = fn(result, key, index) ? -1 : 1
        }
      }
      if (state < 1) return [state]
    }

    if (state > 0) return [state, result]
    return [state]
  }

  private _chainIter(chain: IterChain) {
    // @ts-ignore
    return new this.constructor(this._iterator, [...this._chains, chain]) as any
  }

  // Chainable methods

  map<R>(this: IterList<T>, fn: T_MAP_CHAIN<T, KEY, R>[1]): IterList<R>

  map<This extends IterObject<T>, R>(
    this: This,
    fn: T_MAP_CHAIN<T, KEY, R>[1]
  ): IterObject<R, IterObjectKey<This>>

  map<R>(this: any, fn: T_MAP_CHAIN<T, KEY, R>[1]): any {
    return this._chainIter([C_MAP, fn])
  }

  mapReduce<A>(this: IterList<T>, fn: T_MAP_REDUCE_CHAIN<T, KEY, A>[1], initial?: A): IterList<A>

  mapReduce<This extends IterObject<T>, A>(
    this: This,
    fn: T_MAP_REDUCE_CHAIN<T, KEY, A>[1],
    initial?: A
  ): IterObject<A, IterObjectKey<This>>

  mapReduce<A>(this: any, fn: T_MAP_REDUCE_CHAIN<T, KEY, A>[1], initial?: A): any {
    return this._chainIter([C_MAP_REDUCE, fn, initial])
  }

  filter(fn: T_FILTER_CHAIN<T, KEY>[1]): this {
    return this._chainIter([C_FILTER, fn])
  }

  until(fn: T_STOP_CHAIN<T, KEY>[1]): this {
    return this._chainIter([C_STOP, fn])
  }

  forEach(fn: (val: T, key: KEY, index: number) => void): this {
    this._iterate(fn)
    return this
  }

  // Terminal methods

  reduce<A>(fn: (acc: A, val: T, key: KEY, index: number) => A, initial: A): A {
    let acc = initial
    this._iterate((result, key, index) => {
      acc = fn(acc, result, key, index)
    })
    return acc
  }

  private _toCollection(
    collection: any,
    setter: (collection: any, key: KEY, value: any) => void,
    mappers?: CollecitonMapFns<any, KEY, any, any>
  ) {
    const iterateFn = mappers
      ? (val: any, key: KEY, index: number) => {
          const mappedKey = mappers.key?.(val, key, index) ?? key
          const mappedVal = mappers.value?.(val, key, index) ?? val

          setter(collection, mappedKey, mappedVal)
        }
      : (val: any, key: KEY) => setter(collection, key, val)

    this._iterate(iterateFn)
    return collection
  }

  toArray(): Array<T>
  toArray<R>(mapFn: (val: T, key: KEY, index: number) => R): Array<R>
  toArray(mapFn?: (val: T, key: KEY, index: number) => any): Array<any> {
    return this._toCollection([], (arr, _, value) => arr.push(value), mapFn && { value: mapFn })
  }

  // toSet
  toSet(): Set<T>
  toSet<V>(mapFn: (val: T, key: KEY, index: number) => V): Set<V>
  toSet<V>(mapFn?: (val: T, key: KEY, index: number) => V): Set<V> {
    return this._toCollection(new Set(), (set, value) => set.add(value), mapFn && { value: mapFn })
  }

  toObject(): { [key: string]: T }
  toObject<K extends string, V>(mappers: CollecitonMapFns<T, KEY, K, V>): { [key in K]: V }
  toObject<K extends string, V>(mappers?: CollecitonMapFns<T, KEY, K, V>): { [key: string]: any } {
    return this._toCollection({}, (obj, key, value) => (obj[key] = value), mappers)
  }

  // toMap
  toMap(): Map<number, T>
  toMap<K, V>(mappers: CollecitonMapFns<T, KEY, K, V>): Map<K, V>
  toMap<K, V>(mappers?: CollecitonMapFns<T, KEY, K, V>): Map<K, V> {
    return this._toCollection(new Map(), (ma, key, value) => ma.set(key, value), mappers)
  }

  // toGenerator
  // abstract toGenerator<R>(mapFn?: (val: T, key: KEY, index: number) => R): Generator<any>
}
