import { ChildOf, Iter, IterCollection, IterLite, KeyOfIter, ValueOfIter } from '.'

export const fromIter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): Iter<ValueOfIter<ChildOf<Collections>>, KeyOfIter<ChildOf<Collections>>> => {
  return new Iter(iterators)
}

export const iter = <Collections extends IterCollection<any>[]>(
  ...iterators: Collections
): IterLite<ValueOfIter<ChildOf<Collections>>, KeyOfIter<ChildOf<Collections>>> => {
  return new IterLite(iterators)
}
