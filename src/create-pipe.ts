import { CN, Iter, IterLite } from './internal'

export const createPipe: PipeCreator = (...chains: CN[]) => {
  return (iter: IterLite<any, any>) => {
    return iter.pipe(...chains)
  }
}

export type PipeWorker<T, KEY, R> = {
  (iter: IterLite<T, KEY>): IterLite<R, KEY>
  (iter: Iter<T, KEY>): Iter<R, KEY>
}

export interface PipeCreator {
  <T, KEY, A>(a: CN<T, KEY, A>): PipeWorker<T, KEY, A>
  <T, KEY, A, B>(a: CN<T, KEY, A>, b: CN<A, KEY, B>): PipeWorker<T, KEY, B>
  <T, KEY, A, B, C>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>): PipeWorker<T, KEY, C>
  <T, KEY, A, B, C, D>(a: CN<T, KEY, A>, b: CN<A, KEY, B>, c: CN<B, KEY, C>, d: CN<C, KEY, D>): PipeWorker<
    T,
    KEY,
    D
  >
  <T, KEY, A, B, C, D, E>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>
  ): PipeWorker<T, KEY, E>
  <T, KEY, A, B, C, D, E, F>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>
  ): PipeWorker<T, KEY, F>
  <T, KEY, A, B, C, D, E, F, G>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>,
    g: CN<F, KEY, G>
  ): PipeWorker<T, KEY, G>
  <T, KEY, A, B, C, D, E, F, G, H>(
    a: CN<T, KEY, A>,
    b: CN<A, KEY, B>,
    c: CN<B, KEY, C>,
    d: CN<C, KEY, D>,
    e: CN<D, KEY, E>,
    f: CN<E, KEY, F>,
    g: CN<F, KEY, G>,
    h: CN<G, KEY, H>
  ): PipeWorker<T, KEY, H>
}
