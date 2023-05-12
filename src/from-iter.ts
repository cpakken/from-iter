import { ChildOf, IterBase, IterCollection, KeyOfIter, ValueOfIter } from '.'

export const fromIter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): IterBase<ValueOfIter<ChildOf<Collections>>, KeyOfIter<ChildOf<Collections>>> => {
  return new IterBase(iterators)
}
