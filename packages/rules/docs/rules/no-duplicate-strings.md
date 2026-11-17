# no-duplicate-strings

Reports every occurrence of a string once its value reaches the repetition threshold in a single file. Quoted strings
and template literals without substitutions count together; templates with substitutions do not count.

## Accepted

```ts
const orderShipped = "order.shipped";
subscribe(orderShipped);
publish(orderShipped);
unsubscribe(orderShipped);
```

## Rejected

```ts
subscribe("order.shipped");
publish(`order.shipped`);
unsubscribe("order.shipped");
```

## Options

| Option          | Type                    | Default | Effect                                                |
| --------------- | ----------------------- | ------- | ----------------------------------------------------- |
| `threshold`     | Integer ≥ 2             | `3`     | Report values that appear at least this many times.   |
| `shortString`   | Integer ≥ 0             | `10`    | Ignore values shorter than this length.               |
| `ignoreStrings` | Array of unique strings | `[]`    | Skip exact matches regardless of length or frequency. |
