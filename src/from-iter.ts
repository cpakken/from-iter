import { IterBase, PrevResultStore } from './IterBase'

export class IterList<T> extends IterBase<T, number> {
  protected _iterate(callback: (result: T, key: number, index: number) => void) {
    let key = 0
    let index = 0

    //Store previous mapReduce results per reducer
    const prevResultStore: PrevResultStore<T, number> = new WeakMap()

    for (const item of this._iterator) {
      const state = this._pipeItem(callback, prevResultStore, item, key, index)
      if (state > 0) index++
      if (state < 0) break
      key++
    }
  }
}

export type IterObjectKey<ITER> = ITER extends IterObject<any, infer KEY> ? KEY : never

export class IterObject<T, KEY extends string = string> extends IterBase<T, KEY> {
  protected _iterate(callback: (result: T, key: KEY, index: number) => void) {
    let index = 0

    //Store previous mapReduce results per reducer
    const prevResultStore: PrevResultStore<T, string> = new WeakMap()
    const object = this._iterator as any

    for (const key in object) {
      const item = object[key]
      const state = this._pipeItem(callback, prevResultStore, item, key as KEY, index)
      if (state > 0) index++
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
