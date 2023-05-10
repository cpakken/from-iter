- fromIter(iterable).pipe()
- AsyncInterChain


names
  - iter
  - ts-iter
  - iter-ts
  - chainiter chain-iter 
  - iterchain iter-chain 

  - fromiter from-iter **


```ts

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


```