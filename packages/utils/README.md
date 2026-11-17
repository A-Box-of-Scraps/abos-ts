# Utils

A Box of Scraps's TypeScript utilities.

## Installation

```sh
npm install @pi-pack/ts-utils
```

The package ships compiled ESM and TypeScript declarations.

```ts
import { assertNever, defineEnum, type EnumValue, isEnum, parseEnum, Result, reverseEnum } from "@pi-pack/ts-utils";
```

## Utilities

This library provides the following utilities:

### Branded Enum

`defineEnum(brand)` creates an enum with branded runtime members. Declare a fresh brand with `const brand = Symbol()`
and chain `.add("Name", value)` calls using string or finite number literals. `EnumValue<typeof MyEnum>` gives the union
of its members. Separate brands keep unrelated enums distinct, even when their primitive values match.

Compare members directly and read `.value` when building API payloads. `isEnum(MyEnum, input)` narrows unknown input
only when it is an actual member; it does not accept raw values. `parseEnum(MyEnum, input)` accepts either a member or
its primitive value and returns the canonical member. Invalid input throws a `TypeError` by default, or an error from
the optional custom error factory.

Each `.add()` call returns a new immutable snapshot without changing the original, preserving existing member
identities. Names with the same value are aliases of one member. `reverseEnum(MyEnum, member)` returns the last declared
name for that member, or `undefined` if the input is not a member of that snapshot.

### Result

`Result<Value, Failure>` represents success or failure as a discriminated union. Create results with `Result.ok(value)`
or `Result.err(error)`, then check the `ok` property to access the corresponding `value` or `error`. Failures can be any
type, not just `Error` instances, making expected failures explicit in return types.

### Assert Never

`assertNever(value)` accepts only `never` to enforce exhaustive handling of unions. Call it in the default branch of a
switch or after handling every case: an unhandled member produces a type error. If reached at runtime, it throws an
error containing the unexpected value.

## Examples

- [Branded Enum](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/enum.ts): Model order
  statuses with branded members, parse API values, and explore membership checks, immutable extension, and aliases.
- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with branded enum members, return successes or failures with `Result`, and enforce exhaustive
  state handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
