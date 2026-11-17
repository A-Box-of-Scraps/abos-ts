# expression-complexity

Limits how many `&&`, `||`, and `??` operators appear in one expression. Parentheses, negation, and TypeScript type
assertions do not reset the count. The default allows three operators; the fourth triggers a report.

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
