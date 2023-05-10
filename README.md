
## Install
```bash
pnpm add from-iter
yarn add from-iter
npm install from-iter
```
### Size
| Package   | Size      | GZipped |
| --------- | --------- | ------- |
| from-iter | 1.52 KB 😎 | 673 B 😲 |

A Tiny Fully typed lazy iterable library for JavaScript / TypeScript

## Quick Start

```ts
import { fromIter } from 'from-iter'

// Create an IterList from anything that implements the Iterable protocol
// AsyncIterableIterator<any>  WIP 

//Iterable List (IterObject) uses for...of loop
//Arrays
const iterList = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

//Map
const map = new Map([['foo', 'bar'], ['baz', 'qux'], ['hello', 'world']])
const iterList = fromIter(map) // same as fromIter(map.entries())
const iterList = fromIter(map.entries())
const iterList = fromIter(map.keys())
const iterList = fromIter(map.values())

//Set
const iterList = fromIter(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

//Generators
function* generator() {
  for (let i = 0; i < 10; i++) {
    yield i
  }
}
const iterList = fromIter(generator())


//Iterable Object (IterObject) uses for...in loop
const iterObj = fromIter({ foo: 'bar', baz: 'qux', hello: 'world' })
  .map((value, key, index) => key.concat(value))

//Chain fn
/**
 * @type Value - inferred from result of previous chain
 * @type Key - IterList -> <number>, IterObject -> <keyof<OBJECT_INPUT>>
 *           - index / key matching the original iterable
 * @type Index - <number> index of the output iterable
 */
const chainFn = (value: Value, key: Key, index: Index) => Result

//Chain operations (lazy evaluation - not executed until terminal operation is called)
const iterList = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  .map((value, key, index) => value * 2)
  .filter((value, key, index) => value % 2 === 0)
  .mapReduce((prev, value, key, index) => prev + value, initialValue)
  .until((value, key, index) => value > 10) 
//  .flatMap((value, key, index) => [value, value * 2]) TODO


//** Terminal operations **//

const reduced = iter.reduce((acc, value) => acc + value, 0)

//to Collection

const array = iter.toArray()
const object = iter.toObject()
const set = iter.toSet()
const map = iter.toMap()
const generator = iter.toGenerator()

//Optional Map Function
const array = iter.toArray((value, key, index) => value * 2)
const set = iter.toSet((value, key, index) => value * 2)
const generator = iter.toGenerator((value, key, index) => value * 2)

const object = iter.toObject({
  key: (value, key, index) => key,
  value: (value, key, index) => value * 2
})

const map = iter.toMap({
  key: (value, key, index) => key,
  value: (value, key, index) => value * 2
})


```
## Description
Inspired by `remeda`  lodash / ramda / remeda 

TODO


## Roadmap
- [ ] Async Iterators `fromIterAsync()` 
- [ ] `createPipe` / `fromIter(iterator).pipe(...)`
- [ ] flatMap -> use `fromIter()` for child iterator items
- [ ] Benchmarks
- [ ] More tests
- [ ] Common chain functions
  - [ ] take, groupBy, takeWhile, drop, dropWhile, dropLast, dropLastWhile, skip, skipWhile, skipLast, skipLastWhile, skipRepeats, skipRepeatsWith, skipRepeatsBy, skipRepeatsWithKey, skipRepeatsBykey, skipWhileWith, skipWhileWithKey, 
