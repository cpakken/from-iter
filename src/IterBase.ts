import {
  C_FILTER,
  C_MAP,
  C_MAP_REDUCE,
  C_STOP,
  CollecitonMapFns,
  IterChain,
  IterCollection,
  IterateCallback,
  PipeState,
  PrevResultStore,
  T_FILTER_CHAIN,
  T_MAP_CHAIN,
  T_MAP_REDUCE_CHAIN,
  T_STOP_CHAIN,
} from './types'

export class IterBase<T, KEY extends string | number> {
  constructor(iterators: IterCollection<T>[])
  constructor(
    iterator: IterCollection<any>,
    chains: [...IterChain[], T_MAP_CHAIN<any, KEY, T> | T_MAP_REDUCE_CHAIN<any, KEY, T>]
  )
  constructor(
    iterators: IterCollection<T>[],
    chains: [...IterChain[], T_FILTER_CHAIN<T, KEY> | T_STOP_CHAIN<T, KEY>]
  )

  constructor(private _iterators: IterCollection<T>[], private _chains: IterChain[] = []) {}

  private _iterate(callback: IterateCallback<T, KEY>) {
    let index = 0

    const prevResultStore = createPrevResultStore<T, KEY>()

    for (const iterator of this._iterators) {
      if (isForOf(iterator)) {
        let key = 0
        for (const item of iterator) {
          const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            callback(result!, key as KEY, index)
            index++
          }
          if (state < 0) break
          key++
        }
      } else {
        for (const key in iterator) {
          const item = iterator[key]
          const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            callback(result!, key as KEY, index)
            index++
          }
          if (state < 0) break
        }
      }
    }
  }

  private _pipeItem(
    prevResultStore: PrevResultStore<T, KEY>,
    item: T,
    key: KEY,
    index: number
  ): [PipeState, T?] {
    // 1 = continue, 0 = skip, -1 = stop
    let state: PipeState = 1

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
    return new this.constructor(this._iterators, [...this._chains, chain]) as any
  }

  // Chainable methods

  map<R>(fn: T_MAP_CHAIN<T, KEY, R>[1]): IterBase<R, KEY> {
    return this._chainIter([C_MAP, fn])
  }

  mapReduce<A>(fn: T_MAP_REDUCE_CHAIN<T, KEY, A>[1], initial?: A): IterBase<A, KEY> {
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
  *toGenerator<R>(mapFn?: (val: T, key: KEY, index: number) => R): Generator<any> {
    let index = 0

    const prevResultStore = createPrevResultStore<T, KEY>()

    for (const iterator of this._iterators) {
      if (isForOf(iterator)) {
        let key = 0
        for (const item of iterator) {
          const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            yield mapFn ? mapFn(result!, key as KEY, index) : result
            index++
          }
          if (state < 0) break
          key++
        }
      } else {
        for (const key in iterator) {
          const item = iterator[key]
          const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            yield mapFn ? mapFn(result!, key as KEY, index) : result
            index++
          }
          if (state < 0) break
        }
      }
    }
  }
}

const createPrevResultStore = <T, KEY>() => new WeakMap() as PrevResultStore<T, KEY>

const isForOf = <T>(val: any): val is Iterable<T> => val[Symbol.iterator]
