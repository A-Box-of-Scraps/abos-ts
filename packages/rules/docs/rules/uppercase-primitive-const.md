# uppercase-primitive-const

Use `UPPER_CASE` for a top-level `const` initialized with a primitive literal or a negated number literal. For example,
`"Toto"` is a literal, but `user.name` is a property read, even when its type is `string`. The rule checks how the value
is written, not its inferred type. It does not require camelCase for other bindings.

## Accepted

```ts
const USER_NAME = "Toto";
export const MAX_RETRIES = 3;
const MIN_OFFSET = -0.04;

const userName = user.name;
const config = { debug: true };
const handleClick = () => {};

function start() {
	const health = 100;
	return health;
}
```

## Rejected

```ts
const health = 100; // Use HEALTH.
const debt = -100; // Use DEBT.
export const isEnabled = true; // Use IS_ENABLED.
```

## What counts as a literal?

Strings (including template literals without substitutions), numbers, bigints, booleans, and `null` match. A single
unary minus directly on a number literal also matches, as in `-100`, `-0.04`, or `-0`. This exception does not cover
`+1`, `-1n`, `-balance`, or `-(a + b)`.

Regular expressions, `undefined`, and TypeScript assertions such as `3 as const` do not match.

The rule checks each binding in a declaration separately. It skips destructuring and declarations inside functions,
blocks, and loops. For matching names, start with an uppercase ASCII letter, use uppercase letters or digits, and
separate words with single underscores.

## Configuration

With the plugin registered as `abos`, add `"abos/uppercase-primitive-const": "error"` to your linter's `rules`. There
are no options or automatic renames.
