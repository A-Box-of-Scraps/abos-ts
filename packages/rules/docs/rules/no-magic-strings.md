# no-magic-strings

Use a named constant or enum member instead of a nonblank string literal on either side of an equality or ordering
comparison, as a `switch` expression, or as a `case` label. Untagged templates without substitutions follow the same
rule; tagged templates and templates with substitutions do not. TypeScript assertions and `satisfies` do not hide a
literal: `status === ("shipped" as const)` is still reported.

## Accepted

```ts
const SHIPPED = "shipped";
if (status === SHIPPED) notifyCustomer();

switch (status) {
	case SHIPPED:
		showTracking();
		break;
}
```

Blank strings are exempt, as are standard `typeof` results in checks such as `typeof status === "string"` or `case
"string"` inside `switch (typeof status)`.

## Rejected

```ts
if (status === "shipped") notifyCustomer();

switch (status) {
	case "shipped":
		showTracking();
		break;
}
```
