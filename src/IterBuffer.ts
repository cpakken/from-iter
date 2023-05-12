import { Iter, IterLite, createPrevResultStore } from '.'

const createBufferResults = <T, KEY>(
  bufferIter: Generator<readonly [T, KEY, number], KEY>,
  runChain: IterLite<T, KEY>['_runChain']
): (() => Generator<readonly [T, KEY, number]>) => {
  const cache: (readonly [T, KEY, number])[] = []
  let isDone = false

  function* bufferGenerator() {
    let idx = 0

    while (!isDone) {
      //yield from cache if available, otherwise yield from next result from bufferIter
      if (cache.length > idx) {
        yield cache[idx]
      } else {
        const { done, value } = bufferIter.next()
        if (done) {
          isDone = true
          return
        }
        cache.push(value)
        yield value
      }
      idx++
    }
  }

  return function* (): Generator<readonly [T, KEY, number]> {
    const prevResultStore = createPrevResultStore<T, KEY>()

    for (const [item, key, index] of isDone ? cache : bufferGenerator()) {
      const [state, result] = runChain(prevResultStore, item, key, index)
      if (state > 0) {
        yield [result!, key, index]
      } else if (state < 0) break
    }
  }
}

export class IterBuffer<T, KEY> extends Iter<T, KEY> {
  constructor(results: Generator<readonly [T, KEY, number], KEY>) {
    super([], [], Iter) //next chain call Iter, instead of IterBuffer

    this._results = createBufferResults(results, this._runChain.bind(this))
  }
}

export class IterLiteBuffer<T, KEY> extends IterLite<T, KEY> {
  constructor(results: Generator<readonly [T, KEY, number], KEY>) {
    super([], [], IterLite) //next chain call IterLite, instead of IterLiteBuffer

    this._results = createBufferResults(results, this._runChain.bind(this))
  }
}
