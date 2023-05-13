import { ChildOrArray, Iter, IterCollection, IterLite, KeyOfIter, ValueOfIter } from './internal'

export const fromIter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): Iter<ValueOfIter<ChildOrArray<Collections>>, KeyOfIter<ChildOrArray<Collections>>> => {
  return new Iter(iterators)
}

export const iter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): IterLite<ValueOfIter<ChildOrArray<Collections>>, KeyOfIter<ChildOrArray<Collections>>> => {
  return new IterLite(iterators)
}
