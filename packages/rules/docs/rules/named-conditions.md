# named-conditions

Name the decision instead of writing `&&` or `||` directly in the test of an `if`, ternary, `while`, `do…while`, or
`for`. A comparison or `??` alone does not trigger the rule.

## Accepted

```ts
const canShip = isPaid && isPacked;
if (canShip) ship();

const hasNextJob = () => queue.length > 0 && !isCancelled;
while (hasNextJob()) processNextJob();
```

Use a predicate for the loop so it checks the current queue and cancellation state on every iteration.

## Rejected

```ts
if (isPaid && isPacked) ship();

while (queue.length > 0 && !isCancelled) processNextJob();
```
