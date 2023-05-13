import { IterLite, IterResult, IteratorSymbol, createPrevResultStore } from '.'

const bufferResultsFactory = <T, KEY>(bufferIter: IterLite<T, KEY>) => {
  const bufferedResults = bufferIter[IteratorSymbol]()

  return function (this: IterLite<T, KEY>) {
    const cache: IterResult<T, KEY>[] = []
    let isDone = false

    function* bufferGenerator() {
      let idx = 0

      while (!isDone) {
        //yield from cache if available, otherwise yield from next result from bufferIter
        if (cache.length > idx) {
          yield cache[idx]
        } else {
          const { done, value } = bufferedResults.next()
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

    const runChain = this._runChain.bind(this)

    return function* (): Generator<IterResult<T, KEY>> {
      const prevResultStore = createPrevResultStore<T, KEY>()

      for (const [item, key, index] of isDone ? cache : bufferGenerator()) {
        const [state, result] = runChain(prevResultStore, item, key, index)
        if (state > 0) {
          if (state === 1) yield [result!, key, index]
          else {
            //TODO state is FLATTEN, yield from flatmap iterator
          }
        } else if (state < 0) break
      }
    }
  }
}

export const buffer = <T extends IterLite<any, any>>(iter: T): T => {
  //@ts-ignore
  return new iter.constructor([], [], bufferResultsFactory(iter))
}
