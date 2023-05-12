import { MapKeyFn, Processor, Store } from '.'

export const toCollection = <T, K, A>(
  collection: A,
  setter: (collection: A, value: T, key: K, index: number) => void
): Processor<T, K, A> => {
  return [
    null,
    [
      collection,
      (collection: A, val: T, key: K, index: number) => (setter(collection, val, key, index), collection),
    ],
  ]
}

export const toArray = <T, K>(): Processor<T, K, T[]> => {
  return toCollection([] as any[], (collection, val) => collection.push(val))
}

export const toSet = <T, K>(): Processor<T, K, Set<T>> => {
  return toCollection(new Set(), (collection, val) => collection.add(val))
}

export const toObject = <T, K, K_ extends string | number | symbol>(
  key?: MapKeyFn<T, K, K_>
): Processor<T, K, Store<any, T>> => {
  const setter = key
    ? (collection: Store<K_, any>, val: T, k: K, i: number) => (collection[key(val, k, i)] = val)
    : // @ts-ignore ONLY ADD if k is string | number | symbol?
      (collection: Store<K & string, any>, val: T, k: K) => (collection[k] = val)

  return toCollection({} as Store<any, any>, setter)
}

export const toMap = <T, K, K_>(key?: MapKeyFn<T, K, K_>): Processor<T, K, Map<any, T>> => {
  const setter = key
    ? (collection: Map<K_, any>, val: T, k: K, i: number) => collection.set(key(val, k, i), val)
    : (collection: Map<K, any>, val: T, k: K) => collection.set(k, val)

  return toCollection(new Map<any, any>(), setter as any)
}
