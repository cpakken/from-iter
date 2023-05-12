import { CN, Iter, createPrevResultStore } from '.'

export class IterBuffer<T, KEY> extends Iter<T, KEY> {
  private _cache = [] as (readonly [T, KEY, number])[]
  private _done = false

  constructor(private bufferIter: Iter<readonly [T, KEY, number], KEY>) {
    super([], [])
  }

  private _baseGenerator: Generator<readonly [T, KEY, number]> | undefined

  protected _chain(chains: readonly CN[]) {
    return new Iter([this.values()], chains) as any
  }

  private *_bufferGenerator() {
    const { _cache } = this
    const baseGenerator = (this._baseGenerator ||= this.bufferIter.values())

    let idx = 0

    while (!this._done) {
      if (_cache.length > idx) {
        yield _cache[idx]
      } else {
        const { done, value } = baseGenerator.next()
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

  *values(): Generator<T> {
    const prevResultStore = createPrevResultStore<T, KEY>()
    const { _runChain, _done, _cache } = this
    const runChain = _runChain.bind(this)

    for (const data of _done ? _cache : this._bufferGenerator()) {
      const [state, result] = runChain(prevResultStore, ...data)
      if (state > 0) {
        yield result!
      } else if (state < 0) break
    }
  }
}
