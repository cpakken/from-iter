const C_FILTER = 0
const C_MAP = 1
const C_MAP_REDUCE = 2
const C_STOP = 3

export type T_FILTER = typeof C_FILTER
export type T_MAP = typeof C_MAP
export type T_MAP_REDUCE = typeof C_MAP_REDUCE
export type T_STOP = typeof C_STOP

export type TCHAIN = T_FILTER | T_MAP | T_MAP_REDUCE | T_STOP

export type T_FILTER_CHAIN<T> = readonly [T_FILTER, (val: T, key: number, index: number) => boolean]
export type T_MAP_CHAIN<T, R = any> = readonly [T_MAP, (val: T, key: number, index: number) => R]
export type T_MAP_REDUCE_CHAIN<T, A = any> = readonly [
  T_MAP_REDUCE,
  (acc: A, val: T, key: number, index: number) => A,
  A | undefined
]
export type T_STOP_CHAIN<T> = readonly [T_STOP, (val: T, key: number, index: number) => boolean]

export type IterChain<T = any> = T_FILTER_CHAIN<T> | T_MAP_CHAIN<T> | T_MAP_REDUCE_CHAIN<T> | T_STOP_CHAIN<T>

type CollecitonMapFns<T, K, V> = {
  key?: (val: T, key: number, index: number) => K
  value?: (val: T, key: number, index: number) => V
}

type PrevResultStore<T> = WeakMap<T_MAP_REDUCE_CHAIN<T>[1], any>

//TODO make IterObject and IterList extends ITer { _iterate }

//make this to abstract class with Key -> [array/map/iterators/iter, number] [object, string]
//for of and for in
export class IterBase<T> {
  constructor(iterator: Iterable<T>)
  constructor(
    iterator: Iterable<any>,
    chains: [...IterChain[], T_MAP_CHAIN<any, T> | T_MAP_REDUCE_CHAIN<any, T>]
  )
  constructor(iterator: Iterable<T>, chains: [...IterChain[], T_FILTER_CHAIN<T> | T_STOP_CHAIN<T>])

  constructor(private _iterator: Iterable<any>, private _chains: IterChain[] = []) {}

  private _iterate(callback: (result: T, key: number, index: number) => void) {
    let key = 0
    let index = 0

    //Store previous mapReduce results per reducer
    const prevResultStore: PrevResultStore<T> = new WeakMap()

    for (const item of this._iterator) {
      const state = this._pipeItem(callback, prevResultStore, item, key, index)
      if (state > 0) index++
      if (state < 0) break
      key++
    }
  }

  private _pipeItem(
    callback: (result: T, key: number, index: number) => void,
    prevResultStore: PrevResultStore<T>,
    item: T,
    key: number,
    index: number
  ) {
    let state = 1 // 1 = continue, 0 = skip, -1 = stop
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
      if (state < 1) return state
    }

    if (state > 0) callback(result, key, index)
    return state
  }

  private _chainIter(chain: IterChain) {
    // @ts-ignore
    return new IterBase(this._iterator, [...this._chains, chain]) as any
  }

  // Chainable methods

  map<R>(fn: T_MAP_CHAIN<T, R>[1]): IterBase<R> {
    return this._chainIter([C_MAP, fn])
  }

  filter(fn: T_FILTER_CHAIN<T>[1]): this {
    return this._chainIter([C_FILTER, fn])
  }

  mapReduce<A>(fn: T_MAP_REDUCE_CHAIN<T, A>[1], initial?: A): IterBase<A> {
    return this._chainIter([C_MAP_REDUCE, fn, initial])
  }

  until(fn: T_STOP_CHAIN<T>[1]): this {
    return this._chainIter([C_STOP, fn])
  }

  forEach(fn: (val: T, key: number, index: number) => void): this {
    this._iterate(fn)
    return this
  }

  // Terminal methods

  reduce<A>(fn: (acc: A, val: T, key: number, index: number) => A, initial: A): A {
    let acc = initial
    this._iterate((result, key, index) => (acc = fn(acc, result, key, index)))
    return acc
  }

  private _toCollection(
    collection: any,
    setter: (collection: any, key: any, value: any) => void,
    mappers?: CollecitonMapFns<any, any, any>
  ) {
    const iterateFn = mappers
      ? (val: any, key: number, index: number) => {
          const mappedKey = mappers.key?.(val, key, index) ?? key
          const mappedVal = mappers.value?.(val, key, index) ?? val

          setter(collection, mappedKey, mappedVal)
        }
      : (val: any, key: number) => setter(collection, key, val)

    this._iterate(iterateFn)
    return collection
  }

  toArray(): Array<T>
  toArray<R>(mapFn: (val: T, key: number, index: number) => R): Array<R>
  toArray(mapFn?: (val: T, key: number, index: number) => any): Array<any> {
    return this._toCollection([], (arr, _, value) => arr.push(value), mapFn && { value: mapFn })
  }

  // toSet
  toSet(): Set<T>
  toSet<V>(mapFn: (val: T, key: number, index: number) => V): Set<V>
  toSet<V>(mapFn?: (val: T, key: number, index: number) => V): Set<V> {
    return this._toCollection(new Set(), (set, value) => set.add(value), mapFn && { value: mapFn })
  }

  toObject(): { [key: string]: T }
  toObject<K extends string, V>(mappers: CollecitonMapFns<T, K, V>): { [key in K]: V }
  toObject<K extends string, V>(mappers?: CollecitonMapFns<T, K, V>): { [key: string]: any } {
    return this._toCollection({}, (obj, key, value) => (obj[key] = value), mappers)
  }

  // toMap
  toMap(): Map<number, T>
  toMap<K, V>(mappers: CollecitonMapFns<T, K, V>): Map<K, V>
  toMap<K, V>(mappers?: CollecitonMapFns<T, K, V>): Map<K, V> {
    return this._toCollection(new Map(), (ma, key, value) => ma.set(key, value), mappers)
  }

  // toGenerator
  toGenerator(): Generator<T>
  toGenerator<R>(mapFn: (val: T, key: number, index: number) => R): Generator<R>
  toGenerator<R>(mapFn?: (val: T, key: number, index: number) => R): Generator<any> {
    const gen = mapFn
      ? function* (this: IterBase<T>) {
          yield* this._iterator
        }
      : function* (this: IterBase<T>) {
          yield* this._iterator
        }

    return gen.bind(this)()
  }
}
