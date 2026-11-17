# Utils

A Box of Scraps's TypeScript utilities.

## Installation

```sh
npm install @a-box-of-scraps/ts-utils
```

The package ships compiled ESM and TypeScript declarations.

```ts
import { assertNever, isEnumValue, parseEnumValue, Result, type ValueOf } from "@a-box-of-scraps/ts-utils";
```

## Utilities

This library provides the following utilities:

### Enum

Use a frozen `as const` object to name string or number values. `ValueOf<typeof Status>` gives the union of its values,
not its keys. The values are plain primitives, so they can be compared or sent in API payloads directly.

```ts
const Status = Object.freeze({ Enabled: "enabled", Disabled: 0 } as const);
type Status = ValueOf<typeof Status>; // "enabled" | 0

function readStatus(input: unknown): Status {
	return parseEnumValue(Status, input);
}
```

Use `isEnumValue(Status, input)` to narrow an unknown input to `Status` without throwing. Use `parseEnumValue` when an
invalid value should throw a `TypeError`. Both check values without coercion: `0` is accepted, but `"0"` and the key
`"Disabled"` are not.

### Result

`Result<Value, Failure>` represents success or failure as a discriminated union. Create results with `Result.ok(value)`
or `Result.err(error)`, then check the `ok` property to access the corresponding `value` or `error`. Failures can be any
type, not just `Error` instances, making expected failures explicit in return types.

### Assert Never

`assertNever(value)` accepts only `never` to enforce exhaustive handling of unions. Call it in the default branch of a
switch or after handling every case: an unhandled member produces a type error. If reached at runtime, it throws an
error containing the unexpected value.

## Examples

- [Enum](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/enum.ts): Restore a saved theme
  with a fallback, but reject an unsupported theme in a new settings request.
- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with literal values, return successes or failures with `Result`, and enforce exhaustive state
  handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/LICENSE) by A Box
of Scraps.
