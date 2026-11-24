# no-shallow-type-predicate

Flags an explicit `value is T` predicate whose only evidence is an array or object check, even though `T` promises
particular elements, required fields, or dictionary values. An object check alone also fails to establish that a value
is an array, even when the target is `unknown[]`. The function name does not matter. Start with `warn`; there is no
automatic fix because either the check or the promised type might need to change.

## Accepted

```ts
type Workspace = { name: string };

function isWorkspace(value: unknown): value is Workspace {
	return typeof value === "object" && value !== null && "name" in value && typeof value.name === "string";
}

const isStrings = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === "string");

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
```

## Rejected

```ts
type Workspace = { name: string };

function isWorkspace(value: unknown): value is Workspace {
	return typeof value === "object" && value !== null; // Accepts {}.
}

const isStrings = (value: unknown): value is string[] => Array.isArray(value); // Accepts [42].
const isScores = (value: unknown): value is Record<string, number> =>
	typeof value === "object" && value !== null && !Array.isArray(value); // Accepts { alice: "hello" }.
```

The rule checks parameters explicitly typed `unknown` or `any` in expression-bodied arrows or functions with a single
`return`. It recognizes `T[]`, `Array<T>`, readonly arrays, `Record<string, T>`, and required properties written inline
or directly in a same-file type alias or interface. It does not need a TypeScript project or follow imports.

A clean lint result is not proof that a guard is correct. For example, checking one field and forgetting another, or
delegating to a schema validator, is outside this rule's scope.
