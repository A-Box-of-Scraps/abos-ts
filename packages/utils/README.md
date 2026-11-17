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

### Branded Enum

`defineEnum(brand)` creates an empty enum. Declare a fresh brand at module scope for each enum you want TypeScript to
keep distinct. Creating a symbol inside a factory gives each call a different runtime brand, but TypeScript does not
give each call a different type.

```ts
import { defineEnum, type EnumValue } from "@a-box-of-scraps/ts-utils";

const protocolBrand = Symbol("Protocol");
export const Protocol = defineEnum(protocolBrand).add("Http2", "h2");
export type Protocol = EnumValue<typeof Protocol>;
```

Member names must start with an uppercase ASCII letter; the remaining characters can be ASCII letters or digits. Values
must be string or finite number literals. `EnumValue` gives the union of the members. You can export an enum without a
type annotation, including from libraries that emit TypeScript declarations.

Compare members directly and read `.value` when building API payloads. `isEnum(Protocol, input)` recognizes members, not
raw values. `parseEnum(Protocol, "h2")` and `parseEnum(Protocol, Protocol.Http2)` both return `Protocol.Http2`. Invalid
input throws a `TypeError` by default without coercing objects or functions. Pass a third argument to `parseEnum` to
create a custom error from the original input.

Each `.add()` returns a new immutable snapshot that preserves existing member identities. Spreading a snapshot copies
only the named members, not `.add`; pass the original snapshot to lookup helpers. Names with the same value in one enum
are aliases of one member. `reverseEnum(MyEnum, member)` returns the last name declared for that member in the given
snapshot, or `undefined` if the member is absent.

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
