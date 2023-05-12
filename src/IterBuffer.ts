import { CN, Iter, createPrevResultStore } from '.'

export class IterBuffer<T, KEY> extends Iter<T, KEY> {
  // declare private _cache = [] as (readonly [T, KEY, number])[]
  // declare private _done = false
  private declare _cache: (readonly [T, KEY, number])[]
  private declare _done: boolean

  constructor(private _bufferIter: Generator<readonly [T, KEY, number], KEY>) {
    super([], [])
    this._cache = []
    this._done = false
  }

  protected _chain(chains: readonly CN[]) {
    return new Iter([this._results()], chains) as any
  }

  private *_bufferGenerator() {
    const { _cache, _bufferIter } = this

    let idx = 0

    while (!this._done) {
      if (_cache.length > idx) {
        yield _cache[idx]
      } else {
        const { done, value } = _bufferIter.next()
        if (done) {
          this._done = true
          return
        }
        _cache.push(value)
        yield value
      }
      idx++
    }
  }

  protected *_results(): Generator<readonly [T, KEY, number]> {
    const prevResultStore = createPrevResultStore<T, KEY>()
    const { _runChain, _done, _cache } = this
    const runChain = _runChain.bind(this)

    for (const [item, key, index] of _done ? _cache : this._bufferGenerator()) {
      const [state, result] = runChain(prevResultStore, item, key, index)
      if (state > 0) {
        yield [result!, key, index]
      } else if (state < 0) break
    }
  }
}
