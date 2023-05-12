import { MapKeyFn, ObjectKey, Processor, Store } from '.'

export const toCollection = <T, K, A>(
  create: () => A,
  setter: (collection: A, value: T, key: K, index: number) => void
): Processor<T, K, A> => [
  [
    (collection: A, val: T, key: K, index: number) => (setter(collection, val, key, index), collection),
    create,
  ],
]

//List Collections

const toArray_ = toCollection(
  (): any[] => [],
  (collection, val) => collection.push(val)
)

export const toArray = <T, K>(): Processor<T, K, T[]> => toArray_

const toSet_ = toCollection(
  (): Set<any> => new Set(),
  (collection, val) => collection.add(val)
)

export const toSet = <T, K>(): Processor<T, K, Set<T>> => toSet_

// Keyed Collections

export const toObject = <T, K, K_ extends ObjectKey>(
  key?: MapKeyFn<T, K, K_>
): Processor<T, K, Store<ObjectKey, T>> => {
  const setter = key
    ? (collection: Store<K_, T>, val: T, k: K, i: number) => (collection[key(val, k, i)] = val)
    : // @ts-ignore ONLY ADD if k is ObjectKey?
      (collection: Store<K, T>, val: T, k: K) => (collection[k] = val)

  // @ts-ignore
  return toCollection(() => ({} as Store<K, T>), setter)
}

export const toMap = <T, K, K_>(key?: MapKeyFn<T, K, K_>): Processor<T, K, Map<any, T>> => {
  const setter = key
    ? (collection: Map<K_, any>, val: T, k: K, i: number) => collection.set(key(val, k, i), val)
    : (collection: Map<K, any>, val: T, k: K) => collection.set(k, val)

  return toCollection(() => new Map<any, any>(), setter as any)
}
