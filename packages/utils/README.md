# Utils

A Box of Scraps's TypeScript utilities.

## Utilities

This library provides the following utilities:

### Branded Enum

`defineEnum(brand, values)` creates a frozen object of branded string members. Declare the brand as a separate `const`
symbol to keep enums with identical string values distinct at compile time. Members remain ordinary strings at runtime.

Use `EnumValue<typeof MyEnum>` to derive the member union, `isEnum` to validate and narrow unknown input, or `parseEnum`
to return a valid member or throw an error from your supplied factory.

### Result

`Result<Value, Failure>` represents success or failure as a discriminated union. Create results with `Result.ok(value)`
or `Result.err(error)`, then check the `ok` property to access the corresponding `value` or `error`. Failures can be any
type, not just `Error` instances, making expected failures explicit in return types.

### Assert Never

`assertNever(value)` accepts only `never` to enforce exhaustive handling of unions. Call it in the default branch of a
switch or after handling every case: an unhandled member produces a type error. If reached at runtime, it throws an
error containing the unexpected value.

## Examples

- [Enum](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/enum.ts): Define distinct branded
  enums, validate external input, and parse values with custom errors.
- [Explicit State](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/examples/explicit-state.ts):
  Model job transitions with literal enum companion objects, return successes or failures with `Result`, and enforce
  exhaustive state handling with `assertNever`.

## Changelog

All notable changes to this package are documented
[HERE](https://github.com/A-Box-of-Scraps/abos-ts/blob/HEAD/packages/utils/CHANGELOG.md).

## License

Licensed under the [MIT License](LICENSE) by A Box of Scraps.
