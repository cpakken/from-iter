import { createPrevResultStore, isForOf } from '.'
import {
  CN,
  C_FILTER,
  C_MAP,
  C_MAP_REDUCE,
  C_STOP,
  IterCollection,
  IterResult,
  PipeState,
  PrevResultStore,
  Processor,
} from './types'

export class IterLite<T, KEY> {
  constructor(
    private _iterators: IterCollection<T>[],
    private _chains: readonly CN[] = [],
    createBufferResults?: () => () => Generator<IterResult<T, KEY>>
  ) {
    if (createBufferResults) {
      this._results = createBufferResults.call(this)
    }

    const callable = this._process.bind(this)

    //@ts-ignore
    Object.setPrototypeOf(callable, this.__proto__)
    return Object.assign(callable, this)
  }

  protected *_results(): Generator<IterResult<T, KEY>> {
    const prevResultStore = createPrevResultStore<T, KEY>()
    const runChain = this._runChain.bind(this)

    let index = 0
    for (const iterator of this._iterators) {
      if (isForOf(iterator)) {
        let key = 0
        for (const item of iterator) {
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          //TODO if state is flatmap state, yield from flatmap iterator
          if (state > 0) {
            yield [result!, key as KEY, index]
            index++
          } else if (state < 0) return
          key++
        }
      } else {
        for (const key in iterator) {
          const item = iterator[key]
          const [state, result] = runChain(prevResultStore, item, key as KEY, index)
          if (state > 0) {
            yield [result!, key as KEY, index]
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
        //TODO case if C_FLATMAP - return iterator with special state flag
      }
      if (state < 1) return [state]
    }

    if (state > 0) return [state, result]
    return [state]
  }

  protected _chain(chains: readonly CN[] = [], priorityChains: readonly CN[] = []) {
    if (!(chains.length || priorityChains)) return this

    // const Klass = this._klass_chain || (this.constructor as typeof IterLite)
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
    for (const data of this._results()) {
      acc = fn(acc, ...data)
    }
    return acc
  }

  // use combination of pipe chain and reducer
  //implement findKey() findIndex() find(), pick()
  /** Use with library reducer methods like
   * groupBy, countBy, last, chunk,
   */
  private _process<A>([[fn, create], chains, priorityChains]: Processor<T, KEY, A>): A {
    return this._chain(chains, priorityChains).reduce(fn, create?.())
  }

  *values(): Generator<T> {
    for (const [item] of this._results()) yield item
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
