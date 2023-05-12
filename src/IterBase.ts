import {
  IterLite,
  IterBuffer,
  filter,
  forEach,
  map,
  mapReduce,
  take,
  toArray,
  toMap,
  toObject,
  toSet,
} from '.'
import {
  CN,
  MapKeyFn,
  ObjectKey,
  PrevResultStore,
  Processor,
  T_FILTER_CHAIN,
  T_MAP_CHAIN,
  T_MAP_REDUCE_CHAIN,
  T_STOP_CHAIN,
} from './types'

export class Iter<T, KEY> extends IterLite<T, KEY> {
  // Chainable methods
  buffer(): IterBuffer<T, KEY> {
    return new IterBuffer(this._results())
  }

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

  // Terminal methods

  forEach(fn: (val: T, key: KEY, index: number) => void): void {
    this.reduce((_, val, key, index) => fn(val, key, index))
  }

  toArray(): Array<T> {
    // return this.to(toArray())
    return this(toArray())
  }

  toSet(): Set<T> {
    // return this.to(toSet())
    return this(toSet())
  }

  toObject(): { [key in KEY & ObjectKey]: T }
  toObject<K extends ObjectKey>(key?: MapKeyFn<T, KEY, K>): { [key in K]: T }
  toObject(keyMapFn?: MapKeyFn<T, KEY, ObjectKey>) {
    // return this.to(toObject(keyMapFn))
    return this(toObject(keyMapFn))
  }

  toMap(): Map<KEY, T>
  toMap<K>(keyMapFn: MapKeyFn<T, KEY, K>): Map<K, T>
  toMap<K>(keyMapFn?: MapKeyFn<T, KEY, K>) {
    // return this.to(toMap(keyMapFn))
    return this(toMap(keyMapFn))
  }
}

export const createPrevResultStore = <T, KEY>() => new WeakMap() as PrevResultStore<T, KEY>

export const isForOf = <T>(val: any): val is Iterable<T> => val[Symbol.iterator]

export interface Iter<T, KEY> {
  <A>(processor: Processor<T, KEY, A>): A

  pipe<T, A>(a: CN<T, KEY, A>): Iter<A, KEY>
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
