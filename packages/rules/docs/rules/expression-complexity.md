# expression-complexity

Counts `&&`, `||`, and `??` in a logical chain. Parentheses, `!`, TypeScript assertions, and `satisfies` do not split
the chain. Separate call arguments count independently: `check(a && b, c || d)` has two chains of one operator each. By
default, a chain with more than three operators is reported once.

## Accepted

```ts
const canApprove = isSignedIn && isReviewer && hasPermission;
const canApproveRequest = canApprove && isOpen && !isLocked;
```

## Rejected

```ts
const canApproveRequest = isSignedIn && isReviewer && hasPermission && isOpen && !isLocked;
```

## Options

- `max` (integer, default `3`, minimum `0`): maximum operators allowed per expression. Set it to `0` to report even a
  single `&&`, `||`, or `??`.
