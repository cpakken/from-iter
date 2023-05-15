import { ChildOfArray, Iter, IterCollection, IterLite, KeyOfIter, ValueOfIter } from './internal'

export const fromIter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): Iter<ValueOfIter<ChildOfArray<Collections>>, KeyOfIter<ChildOfArray<Collections>>> => {
  return new Iter(iterators)
}

export const iter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): IterLite<ValueOfIter<ChildOfArray<Collections>>, KeyOfIter<ChildOfArray<Collections>>> => {
  return new IterLite(iterators)
}
