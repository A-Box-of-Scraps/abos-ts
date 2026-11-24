# named-conditions

Name the decision instead of writing `&&` or `||` in the test of an `if`, ternary, `while`, `do…while`, or `for`. A
comparison or `??` alone does not trigger the rule.

Operators nested in the test still count: `if (check(a && b))` is reported. Operators inside a callback do not count
toward the enclosing test: `if (items.some(item => item.ready && item.valid))` is accepted. The same boundary applies to
class instance field and accessor initializers, but not to computed keys or static initializers. Each affected test is
reported once.

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
