import { ChildOf, Iter, IterCollection, KeyOfIter, ValueOfIter } from '.'

export const fromIter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): Iter<ValueOfIter<ChildOf<Collections>>, KeyOfIter<ChildOf<Collections>>> => {
  return new Iter(iterators)
}
