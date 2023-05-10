import { IterBase } from './IterBase'

export function fromIter<T>(iterator: Iterable<T>): IterBase<T> {
  return new IterBase(iterator)
}
