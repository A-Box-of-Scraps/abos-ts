# Utils

A Box of Scraps's TypeScript utilities.

## Installation

```sh
npm install @a-box-of-scraps/ts-utils
```

The package ships compiled ESM and TypeScript declarations.

```ts
import {
	assertNever,
	defineEnum,
	type EnumValue,
	isEnum,
	parseEnum,
	Result,
	reverseEnum,
} from "@a-box-of-scraps/ts-utils";
```

## Utilities

This library provides the following utilities:

### Result

`Result<Value, Failure>` represents success or failure as a discriminated union. Create results with `Result.ok(value)`
or `Result.err(error)`, then check the `ok` property to access the corresponding `value` or `error`. Failures can be any
type, not just `Error` instances, making expected failures explicit in return types.

### Assert Never

`assertNever(value)` accepts only `never` to enforce exhaustive handling of unions. Call it in the default branch of a
switch or after handling every case: an unhandled member produces a type error. If reached at runtime, it throws an
error containing the unexpected value.

## Examples

- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with literal enum companion objects, return successes or failures with `Result`, and enforce
  exhaustive state handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
