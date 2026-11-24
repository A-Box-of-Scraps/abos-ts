# no-duplicate-strings

Reports every occurrence of a string once its value reaches the repetition threshold in a single file. Quoted strings
and untagged templates without substitutions count together by their decoded value. Matching is case-sensitive and
preserves whitespace. Tagged templates and templates with substitutions do not contribute a template value.

Directives such as `"use strict"` do not count. Neither do static import or re-export paths, quoted import/export names,
or import attributes. In TypeScript, import-type paths and options, import-assignment paths, and quoted module
declaration names are also excluded. Runtime `import()` is different: strings in its path and options count normally.

## Accepted

```ts
const ORDER_SHIPPED = "order.shipped";
subscribe(ORDER_SHIPPED);
publish(ORDER_SHIPPED);
unsubscribe(ORDER_SHIPPED);
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
