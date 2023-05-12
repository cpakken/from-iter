import { IterBuffer, filter, forEach, map, mapReduce, take, toArray, toMap, toObject, toSet } from '.'
import {
  CN,
  C_FILTER,
  C_MAP,
  C_MAP_REDUCE,
  C_STOP,
  IterCollection,
  MapKeyFn,
  PipeState,
  PrevResultStore,
  Processor,
  T_FILTER_CHAIN,
  T_MAP_CHAIN,
  T_MAP_REDUCE_CHAIN,
  T_STOP_CHAIN,
} from './types'

export class Iter<T, KEY> {
  constructor(private _iterators: IterCollection<T>[], private _chains: readonly CN[] = []) {
    //Make instance callable?
    // const to = this.to.bind(this)
    // //@ts-ignore
    // Object.setPrototypeOf(to, this.__proto__)
    // return Object.assign(to, this)
  }

  declare _bufferStore: (readonly [T, KEY])[]

  protected *_results(): Generator<readonly [T, KEY, number]> {
    const prevResultStore = createPrevResultStore<T, KEY>()
    const runChain = this._runChain.bind(this)

    let index = 0
    for (const iterator of this._iterators) {
      if (isForOf(iterator)) {
        let key = 0
        for (const item of iterator) {
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            yield [result!, key as KEY, index]
            index++
          } else if (state < 0) break
          key++
        }
      } else {
        for (const key in iterator) {
          const item = iterator[key]
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            yield [result!, key as KEY, index]
            index++
          } else if (state < 0) break
        }
      }
    }
  }

  *values(): Generator<T> {
    for (const [item] of this._results()) yield item
  }

  protected _runChain(
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
          state = fn(result, key, index) ? 1 : -1
        }
      }
      if (state < 1) return [state]
    }

    if (state > 0) return [state, result]
    return [state]
  }

  protected _chain(chains: readonly CN[]) {
    return new Iter(this._iterators, [...this._chains, ...chains]) as any
  }

  // Chainable methods

  map<R>(fn: T_MAP_CHAIN<T, KEY, R>[1]): Iter<R, KEY> {
    return this._chain([map(fn)])
  }

  //like forEach but in chain
  spy(fn: (val: T, key: KEY, index: number) => void): this {
    return this._chain([forEach(fn)])
  }

  mapReduce<A>(fn: T_MAP_REDUCE_CHAIN<T, KEY, A>[1], initial?: A): Iter<A, KEY> {
    return this._chain([mapReduce(fn, initial)])
  }

  filter(fn: T_FILTER_CHAIN<T, KEY>[1]): this {
    return this._chain([filter(fn)])
  }

  take(fnOrNum: number | T_STOP_CHAIN<T, KEY>[1]): this {
    return this._chain([take(fnOrNum)])
  }

  pipe(...chains: CN[]): any {
    return this._chain(chains)
  }

  buffer(): IterBuffer<T, KEY> {
    return new IterBuffer(this._results())
  }

  // Terminal methods

  reduce<A>(fn: (acc: A | undefined, val: T, key: KEY, index: number) => A): A
  reduce<A>(fn: (acc: A, val: T, key: KEY, index: number) => A, initial: A): A
  reduce<A>(fn: (acc: A | undefined, val: T, key: KEY, index: number) => A, initial?: A): A | undefined {
    let acc = initial
    for (const data of this._results()) {
      acc = fn(acc, ...data)
    }
    return acc
  }

  forEach(fn: (val: T, key: KEY, index: number) => void): void {
    this.reduce((_, val, key, index) => fn(val, key, index))
  }

  // use combination of pipe chain and reducer
  //implement findKey() findIndex() find(), pick()
  /** Use with library reducer methods like
   * groupBy, countBy, last, chunk,
   */
  // to<A>([chains, [initial, fn]]: [CN[] | null, Processor<T, KEY, A>]): A {
  to<A>([chains, [initial, fn]]: Processor<T, KEY, A>): A {
    return (chains ? this._chain(chains) : this).reduce(fn, initial)
  }

  toArray(): Array<T> {
    return this.to(toArray())
  }

  toSet(): Set<T> {
    return this.to(toSet())
  }

  toObject(): { [key in KEY & (string | number | symbol)]: T }
  toObject<K extends string | number | symbol>(
    key?: MapKeyFn<T, KEY, K>
  ): { [key in K & (string | number | symbol)]: T }
  toObject<K extends string>(keyMapFn?: MapKeyFn<T, KEY, K>) {
    return this.to(toObject(keyMapFn))
  }

  toMap(): Map<KEY, T>
  toMap<K>(keyMapFn: MapKeyFn<T, KEY, K>): Map<K, T>
  toMap<K>(keyMapFn?: MapKeyFn<T, KEY, K>) {
    return this.to(toMap(keyMapFn))
  }
}

export const createPrevResultStore = <T, KEY>() => new WeakMap() as PrevResultStore<T, KEY>

const isForOf = <T>(val: any): val is Iterable<T> => val[Symbol.iterator]

export interface Iter<T, KEY> {
  pipe<A>(a: CN<T, KEY, A>): Iter<A, KEY>
  pipe<A, B>(a: CN<T, KEY, A>, b: CN<A, KEY, B>): Iter<B, KEY>
  pipe<A, B, C>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>): Iter<C, KEY>
  pipe<A, B, C, D>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>, d: CN<C, KEY, D>): Iter<D, KEY>
  pipe<A, B, C, D, E>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>
  ): Iter<E, KEY>
  pipe<A, B, C, D, E, F>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>
  ): Iter<F, KEY>
  pipe<A, B, C, D, E, F, G>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>,
    g: CN<F, KEY, G>
  ): Iter<G, KEY>
}
