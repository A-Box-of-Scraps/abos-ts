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

`defineEnum(values)` creates a frozen, readonly object of named string or number values while preserving their literal
types. Use its members at runtime and `EnumValue<typeof MyEnum>` to derive the union of allowed values.

`isEnum(values, input)` checks membership without coercion, returning a boolean rather than acting as a type guard. Use
`parseEnum(values, input, createError?)` to validate unknown input and return its enum value type. Invalid input throws
a `TypeError` by default; pass an error factory to customize the error. `reverseEnum(values, input)` returns the
matching member name, or `undefined` if no value matches. For duplicate values, the last matching entry wins.

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
  validate unknown API input before enqueueing jobs, look up member names, and customize validation errors.
- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with literal enum companion objects, return successes or failures with `Result`, and enforce
  exhaustive state handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
