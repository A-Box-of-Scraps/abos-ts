# Utils

A Box of Scraps's TypeScript utilities.

## Installation

```sh
npm install @a-box-of-scraps/ts-utils
```

The package ships compiled ESM and TypeScript declarations.

```ts
import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "@a-box-of-scraps/ts-utils";
```

## Utilities

This library provides the following utilities:

### Enum

`defineEnum(values)` freezes a plain object of named string or number literals while preserving readonly member types.
Each member must have a single literal type: widened types, union-valued members, optional members, index signatures,
and union-shaped definitions are rejected at compile time. Definitions must use enumerable, string-keyed data
properties; accessors, hidden properties, symbol keys, and custom prototypes are rejected at runtime. Use members at
runtime and `EnumValue<typeof MyEnum>` to derive their value union. Numeric combinations can be declared as literal
members such as `All: 7`; collections of string members belong in a separate array.

`isEnum(values, input)` accepts a `defineEnum` result and checks membership without coercion, narrowing matching input
to the enum value union. `parseEnum(values, input, createError?)` returns a matching value or throws a `TypeError` by
default; pass an error factory to customize the error. `reverseEnum(values, input)` returns the matching member name, or
`undefined` if no value matches; the last matching entry wins for duplicate values. Parsing and reverse lookup also
accept ordinary string/number maps. For reliable typing, define enums directly from complete object literals and use the
original frozen result. Structurally narrowed definitions and extended spread copies can contain runtime members absent
from the inferred value union, so the API does not guarantee type safety for those inputs.

### Result

`Result<Value, Failure>` represents success or failure as a discriminated union. Create results with `Result.ok(value)`
or `Result.err(error)`, then check the `ok` property to access the corresponding `value` or `error`. Failures can be any
type, not just `Error` instances, making expected failures explicit in return types.

### Assert Never

`assertNever(value)` accepts only `never` to enforce exhaustive handling of unions. Call it in the default branch of a
switch or after handling every case: an unhandled member produces a type error. If reached at runtime, it throws an
error containing the unexpected value.

## Examples

- [Enum](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/enum.ts): Define job priorities,
  narrow and parse unknown input, look up member names, customize errors, and use numeric combinations and separate
  collections of string members.
- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with literal enum companion objects, return successes or failures with `Result`, and enforce
  exhaustive state handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
