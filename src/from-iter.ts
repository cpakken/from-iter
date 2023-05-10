import { IterBase, IterateCallback, PrevResultStore } from './IterBase'

export class IterList<T> extends IterBase<T, number> {
  protected _iterate(callback: IterateCallback<T, number>) {
    let key = 0
    let index = 0

    const prevResultStore = createPrevResultStore<T, number>()

    for (const item of this._iterator) {
      const [state, result] = this._pipeItem(prevResultStore, item, key, index)
      if (state > 0) {
        callback(result!, key, index)
        index++
      }
      if (state < 0) break
      key++
    }
  }

  // toGenerator
  toGenerator(): Generator<T>
  toGenerator<R>(mapFn: (val: T, key: number, index: number) => R): Generator<R>
  *toGenerator<R>(mapFn?: (val: T, key: number, index: number) => R): Generator<any> {
    let key = 0
    let index = 0

    const prevResultStore = createPrevResultStore<T, number>()

    for (const item of this._iterator) {
      const [state, result] = this._pipeItem(prevResultStore, item, key, index)
      if (state > 0) {
        // callback(result!, key, index)
        yield mapFn ? mapFn(result!, key, index) : result
        index++
      }
      if (state < 0) break
      key++
    }
  }
}

export type IterObjectKey<ITER> = ITER extends IterObject<any, infer KEY> ? KEY : never

export class IterObject<T, KEY extends string = string> extends IterBase<T, KEY> {
  protected _iterate(callback: IterateCallback<T, KEY>) {
    let index = 0

    const prevResultStore = createPrevResultStore<T, KEY>()
    const object = this._iterator as any

    for (const key in object) {
      const item = object[key]
      const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
      if (state > 0) {
        callback(result!, key as KEY, index)
        index++
      }
      if (state < 0) break
    }
  }

  // toGenerator
  toGenerator(): Generator<T>
  toGenerator<R>(mapFn: (val: T, key: KEY, index: number) => R): Generator<R>
  *toGenerator<R>(mapFn?: (val: T, key: KEY, index: number) => R): Generator<any> {
    let index = 0

    const prevResultStore = createPrevResultStore<T, KEY>()
    const object = this._iterator as any

    for (const key in object) {
      const item = object[key]
      const [state, result] = this._pipeItem(prevResultStore, item, key as KEY, index)
      if (state > 0) {
        yield mapFn ? mapFn(result!, key as KEY, index) : result
        index++
      }
      if (state < 0) break
    }
  }
}

export function fromIter<T>(iterator: Iterable<T>): IterList<T>
export function fromIter<T extends { [key: string]: any }>(
  iterator: T
): IterObject<T[keyof T], keyof T & string>
export function fromIter(iterator: any) {
  return iterator[Symbol.iterator] ? new IterList(iterator) : new IterObject(iterator)
}

const createPrevResultStore = <T, KEY>() => new WeakMap() as PrevResultStore<T, KEY>
