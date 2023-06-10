import { flatmap, map } from './internal'
import {
  CN,
  C_FILTER,
  C_FLATMAP,
  C_MAP,
  C_MAP_REDUCE,
  C_STOP,
  ChainResult,
  IterCollection,
  IterResult,
  KeyOfIter,
  PipeState,
  PrevResultStore,
  Processor,
  ValueOfIter,
} from './types'

export const IteratorSymbol: typeof Symbol.iterator = Symbol.iterator

export class IterLite<T, KEY> {
  constructor(
    private _iterators: IterCollection<T>[],
    private _chains: readonly CN[] = [],
    createBufferResults?: () => () => Generator<IterResult<T, KEY>>
  ) {
    if (createBufferResults) {
      //If buffer results iterator is provided, use it instead of going through the chain
      this[IteratorSymbol] = createBufferResults.call(this)
    }

    const callable = this._process.bind(this)

    //@ts-ignore
    Object.setPrototypeOf(callable, this.__proto__)
    return Object.assign(callable, this)
  }

  *[IteratorSymbol](): Generator<IterResult<T, KEY>> {
    const prevResultStore = createPrevResultStore<T, KEY>()
    const runChain = this._runChain.bind(this)

    let index = 0
    for (const iterator of this._iterators) {
      if (isForOf(iterator)) {
        let key = 0
        for (const item of iterator) {
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            if (state === 1) yield [result!, key as KEY, index]
            else {
              //TODO FLatten TEST THIS
              for (const [v] of result as IterLite<T, any>) {
                yield [v, key as KEY, index]
                index++
              }
            }
            index++
          } else if (state < 0) return
          key++
        }
      } else {
        for (const key in iterator) {
          const item = iterator[key]
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            if (state === 1) yield [result!, key as KEY, index]
            else {
              //TODO state is FLATTEN, yield from flatmap iterator
            }
            index++
          } else if (state < 0) return
        }
      }
    }
  }

  protected _runChain(
    prevResultStore: PrevResultStore<T, KEY>,
    item: T,
    key: KEY,
    index: number
  ): ChainResult<T> {
    let state: PipeState = 1 // -1 = stop, 0 = skip, 1 = continue, 2 = flatten
    let result = item
    const chains = this._chains
    const { length } = chains

    for (let i = 0; i < length; i++) {
      const chain = chains[i]
      const [type, fn] = chain

      switch (type) {
        case C_MAP:
          result = fn(result, key, index)
          break
        case C_FILTER:
          if (!fn(result, key, index)) state = 0
          break
        case C_MAP_REDUCE: {
          const init = chain[2]
          const prev = prevResultStore.has(fn)
            ? prevResultStore.get(fn)
            : (prevResultStore.set(fn, init), init)

          result = fn(prev, result, key, index)

          prevResultStore.set(fn, result)
          break
        }
        case C_STOP:
          state = fn(result, key, index) ? 1 : -1
          break
        case C_FLATMAP: {
          const level = chain[2]
          if (level && isValidIter(result)) {
            const nextLevel = level - 1
            const CN = chains.slice(i)

            //level > 1 - lower level
            if (nextLevel) CN[0] = flatmap(fn, nextLevel)
            //level === 1 - stopping condition, use regular map
            else CN[0] = map((inner: [ValueOfIter<T>, KeyOfIter<T>, number]) => fn(inner, key, index))

            //recurse into collection to unwrap
            return [2, new IterLite<ValueOfIter<T>, KeyOfIter<T>>([result], CN)]
          }
          //level === 0
          result = fn([result], key, index)
          break
        }
      }
      if (state < 1) return [state]
    }

    if (state > 0) return [state, result]
    return [state]
  }

  protected _chain(chains: readonly CN[] = [], priorityChains: readonly CN[] = []) {
    if (!(chains.length || priorityChains)) return this

    const Klass = this.constructor as typeof IterLite

    return new Klass(this._iterators, [...priorityChains, ...this._chains, ...chains]) as any
  }

  // Chainable methods
  pipe(...chains: CN[]): any {
    return this._chain(chains)
  }

  // Terminal methods
  reduce<A>(fn: (acc: A | undefined, val: T, key: KEY, index: number) => A): A
  reduce<A>(fn: (acc: A, val: T, key: KEY, index: number) => A, initial: A): A
  reduce<A>(fn: (acc: A | undefined, val: T, key: KEY, index: number) => A, initial?: A): A | undefined {
    let acc = initial
    for (const data of this) {
      acc = fn(acc, ...data)
    }
    return acc
  }

  private _process<A>(processor: Processor<T, KEY, A>): A {
    const [[fn, create], chains, priorityChains] = processor
    return this._chain(chains, priorityChains).reduce(fn, create?.())
  }

  *values(): Generator<T> {
    for (const [item] of this) yield item
  }
}

export interface IterLite<T, KEY> {
  <A>(processor: Processor<T, KEY, A>): A

  pipe<A>(a: CN<T, KEY, A>): IterLite<A, KEY>
  pipe<A, B>(a: CN<T, KEY, A>, b: CN<A, KEY, B>): IterLite<B, KEY>
  pipe<A, B, C>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>): IterLite<C, KEY>
  pipe<A, B, C, D>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>, d: CN<C, KEY, D>): IterLite<D, KEY>
  pipe<A, B, C, D, E>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>
  ): IterLite<E, KEY>
  pipe<A, B, C, D, E, F>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>
  ): IterLite<F, KEY>
  pipe<A, B, C, D, E, F, G>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>,
    g: CN<F, KEY, G>
  ): IterLite<G, KEY>
  pipe<A, B, C, D, E, F, G, H>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>,
    g: CN<F, KEY, G>,
    h: CN<G, KEY, H>
  ): IterLite<H, KEY>
}

export const isValidIter = (thing: any): thing is Iterable<any> => {
  // return thing && typeof thing === 'object' && IteratorSymbol in thing
  return thing && typeof thing === 'object'
}

export const createPrevResultStore = <T, KEY>() => new WeakMap() as PrevResultStore<T, KEY>

export const isForOf = <T>(val: any): val is Iterable<T> => val[IteratorSymbol]
