
names
  - iter
  - ts-iter
  - iter-ts
  - chainiter chain-iter 
  - iterchain iter-chain 

  - fromiter from-iter **

class IterChain {}

const a = fromIter(iterable).toArray()

```ts

/**
 * const a = new Map()
 * const itered = iter(a.entries()).pipe(
 *  map(([k, v]) => [k, v]),
 *  filter(([k, v]) => v > 1),
 * )
 *
 * const grouped = itered.reduce(groupBy())
 * const arr = iter.toArray()
 *
 */

const a = new Map()
const itered = iter(a.entries()).pipe(
  map(([k, v], i, obj /* array so far */) => [k, v]),
  filter(([k, v]) => v > 1),
)

const iterObj = iter({a: 1, b: 2}).pipe(
  map((v, k /* string */, obj /* object so far */) => [k, v]),
  filter((v, k) => v > 1),
).toArray()

const iterArr = iter(values()).toArray(mapFn)

const b = iter.map().filter().pipe()

const c = b.toArray()
const d = b.reduce()

const grouped = itered.reduce(groupBy())
const arr = iter.toArray()

const pipe = createPipe()
const pa = pipe(values()) as Iter

const arrPipe = createPipe().toArray()
const parr = arrPipe(values()) as any[]

const reducePipe = createPipe().reduce()
const pr = reducePipe(values()) as any


// realizers
.toArray()
.toObject(mapKeyFn)
.reduce()
.toMap(mapKeyFn)
.toSet()
.toGenerator()

//pipes
.pipe(...)
.map(...)
.map.withPrev(...)
.filter(...)
.until(...)


class Iter {...}
// include [Symbol.iterator](): Iterator
// can use in for of loop and spread operator (without realizers)

class AsyncIter {...}



function map(fn: (v: any, k: any, obj: any) => any): [fn, 0 | 1] 

// 0 for map 
// 1 for filter 
// 2 for reduce
// 3 for stopper ( until(fn) )





//Use speical symbol to return to stop iteration

```