# from-iter
A Tiny Fully-Typed tree shakable lazy iterable library for JavaScript / TypeScript.
Combine and iterate over any iterable object or array with a simple chainable API.

Internally uses `for...of` for iterables and `for...in` for iterable objects to pipe values through a chain of functions.

Unlike chaining arrays, this library does not create intermediate arrays for each operation, instead, it iterates over the values and passes them through the chain of functions.

## Install
```bash
pnpm add from-iter
yarn add from-iter
npm install from-iter
```
### Size
| Package           | Size    | GZipped |
| ----------------- | ------- | ------- |
| iter() (lite)     | 1.02 KB | 544 B   |
| fromIter() (full) | 1.66 KB | 805 B   |

Test treeshaking size @ bundlejs.com 
- https://bundlejs.com/?q=from-iter&bundle

---

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

//Combinations
const hybridIter = fromIter([1, 2, 3], [4, 5, 6], new Map(...), { foo: 'bar' })

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
  // [2, 4, 6, 8, 10]
  .filter((value, key, index) => value % 2 === 0)
  // [4, 8, 12, 16, 20]
  .map((value, key, index) => value * 2)
  // logs {value: 4, key: 1, index: 0}, {value: 8, key: 3, index: 1}, {value: 12, key: 5, index: 2}, {value: 16, key: 7, index: 3}, {value: 20, key: 9, index: 4
  .spy((value, key, index) => console.log({value, key, index})) //like forEach() but within the chain
  // [4, 12, 24, 40, 60]
  .mapReduce((prev, value, key, index) => prev + value, 0 /* initialValue */)
//  .flatMap((value, key, index) => [value, value * 2]) TODO
  

//If .take() is included in chain,  will stop iterating once the condition is met
const iterListWillEarlyTerminate = iterList.take((value, key, index) => value < 30)



//** Terminal operations **//

iterList.forEach((value, key, index) => console.log(value, key, index))

const reduced = iterList.reduce((acc, value, key, index) => acc + value, 0)

// Call Chain-Reducer Utilities (directly callable)
const grouped = iterList(groupBy((x) => (x % 2 === 0 ? 'even' : 'odd')))

const found = iterList(find((x) => x === 5))

//to Collection

const array = iterList.toArray()
const object = iterList.toObject()
const set = iterList.toSet()
const map = iterList.toMap()
const iterator = iterList.values()

//Keyed Collection has an optional key mapper
const object = iterList.toObject((value, key, index) => key + '!')
const map = iterList.toMap((value, key, index) => key + '!')



// Buffering
// use buffers to lazily cache piped values. Does not run until terminal operation is called.
import { fromIter, buffer } from 'from-iter'

const buffered = buffer(fromIter([1, 2, 3, 4, 5]).map((x) => x * 2))

const list = buffered.toArray()
const set = buffered.toSet()
buffered.forEach((x) => console.log(x))
const reduced = buffered.reduce((acc, x) => acc + x, 0)

//buffer chain only called once per item


```
## IterLite
LITE: 1.5KB (765B gzipped)
  - pipe - import chain methods manually 
  - reduce()
  - values()

FULL: (all lite methods) 2.15kB (1 KB gzipped)
  - chainable methods 
    - map() 
    - spy() 
    - mapReduce() 
    - filter() 
    - take() 
  - Terminal methods
    - forEach() 
    - toArray() 
    - toSet() 
    - toMap(mapKey?) 
    - toObject(mapKey?)


```ts
const { iter, map, filter, toArray, fromIter } from 'from-iter'
//Only import functions you need to reduce bundle size

const list = iter([1, 2, 3, 4, 5]) //lite
  .pipe(
    filter((x) => x % 2 === 0)
    map((x) => x * 2),
  )(toArray())

const listFull = fromIter([1, 2, 3, 4, 5]) //full
  .filter((x) => x % 2 === 0)
  .map((x) => x * 2)
  .toArray()

```

### createPipe()
```ts
import { map, filter, iter, toArray, createPipe } from '..'

const pipe = createPipe(
  filter((x: number) => x % 2 === 0), //make sure you type the arguments of the first chain
  map((x) => x * 2)
)

const numbers = iter([1, 2, 3, 4, 5, 6, 7, 8, 9])
const result = pipe(numbers)(toArray())
//result: [4, 8, 12, 16]

const numbers2 = fromIter([1, 2, 3, 4, 5, 6, 7, 8, 9])
const result2 = pipe(numbers2).tArray()


```



Inspired by remeda, lodash, ramda, and other functional libraries.

## Roadmap
- [x] .buffer()
- [x] `createPipe`
- [ ] common use cases examples (combine objects)
- [ ] Async Iterators `fromIterAsync()` 
- [ ] flatMap -> use `fromIter()` for child iterator items
- [ ] Benchmarks
- [ ] More tests
- [ ] Common chain functions
  - [ ] take, groupBy, takeWhile, drop, dropWhile, dropLast, dropLastWhile 