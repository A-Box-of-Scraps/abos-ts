<!-- Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). -->

# Changelog

## [Unreleased]

### Fixed

- [`no-duplicate-strings`](docs/rules/no-duplicate-strings.md) no longer counts directives, tagged templates, or strings
  in static module syntax (including import attributes and TypeScript import-type options). Strings in runtime
  `import()` calls still count.
- [`named-conditions`](docs/rules/named-conditions.md) no longer flags instance field or auto-accessor initializers as
  part of an enclosing condition. Computed keys and static initializers still count.
- [`no-magic-strings`](docs/rules/no-magic-strings.md) now checks comparisons and switches through TypeScript assertions
  and `satisfies`, preserving the exemption for standard `typeof` results.
- [`no-shallow-type-predicate`](docs/rules/no-shallow-type-predicate.md) now flags array claims based only on object
  checks and recognizes redundant container checks. It distinguishes type-only declarations from runtime bindings when
  identifying the built-in `Array.isArray`.

## [0.3.0] - 2026-11-18

### Added

- [`uppercase-primitive-const`](docs/rules/uppercase-primitive-const.md) requires `UPPER_CASE` for top-level `const`
  bindings initialized with primitive literals or negated number literals.

## [0.2.0] - 2026-11-17
