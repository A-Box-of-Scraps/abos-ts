import { readFileSync } from "node:fs";

interface TestCase {
	name: string;
	code: string;
	filename?: string;
	options?: { threshold?: number; ignoreStrings?: string[]; shortString?: number }[];
}

interface ExpectedError {
	occurrences: number;
	line?: number;
	column?: number;
}

interface InvalidTestCase extends TestCase {
	errors: ExpectedError[];
}

function duplicateErrors({ occurrences }: { occurrences: number }): ExpectedError[] {
	return Array.from({ length: occurrences }, () => ({ occurrences }));
}

function readFixture(path: string): string {
	return readFileSync(new URL(`fixtures/no-duplicate-strings/${path}`, import.meta.url), "utf8");
}

const valid: TestCase[] = [
	{
		name: "static import and re-export attributes do not contribute to ordinary string counts",
		code: [
			"import a from 'a' with { 'custom-format': 'custom-value' };",
			"export * from 'b' with { 'custom-format': 'custom-value' };",
			"use('custom-format', 'custom-value');",
		].join("\n"),
	},
	{
		name: "tags can distinguish templates with the same cooked value",
		code: "String.raw`abcdefghij\\n`; String.raw`abcdefghij\\x0a`; use('abcdefghij\\n');",
	},
	{
		name: "quoted import, export and namespace names are not ordinary strings",
		code: [
			"import { 'external-name' as a } from 'pkg';",
			"export { a as 'external-name' };",
			"export { 'external-name' as b } from 'pkg';",
			"export * as 'namespace-name' from 'other';",
			"use('namespace-name', 'namespace-name');",
			"use('external-name', 'external-name');",
		].join("\n"),
	},
	{
		name: "static imports and re-exports do not count toward the threshold",
		code: [
			"import { a } from 'example-package';",
			"export { b } from 'example-package';",
			"export * from 'example-package';",
			"use('example-package', 'example-package');",
		].join("\n"),
	},
	{
		name: "program and function directives do not contribute to the threshold",
		code: "'use strict'; function f() { 'use strict'; } use('use strict', 'use strict');",
	},
	{ name: "strings below the default threshold", code: "use('long enough'); use('long enough')" },
	{ name: "strings shorter than ten characters", code: "use('123456789', '123456789', '123456789')" },
	{
		name: "non-string literals",
		code: "use(1234567890, 1234567890, 1234567890, /long enough/, /long enough/, /long enough/)",
	},
	// eslint-disable-next-line no-template-curly-in-string -- This is source code passed to the parser.
	{ name: "dynamic templates", code: "use(`long enough ${a}`, `long enough ${a}`, `long enough ${a}`)" },
	{ name: "templates with invalid cooked values", code: "tag`\\unicode`; tag`\\unicode`; tag`\\unicode`" },
	{
		name: "exact exclusions",
		code: "use('long enough', 'long enough', 'long enough', 'another string', 'another string', 'another string')",
		options: [{ ignoreStrings: ["long enough", "another string"] }],
	},
	{
		name: "custom threshold",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ threshold: 4 }],
	},
	{
		name: "custom minimum length",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ shortString: 12 }],
	},
	{ name: "case-sensitive values", code: "use('long enough', 'Long enough', 'LONG ENOUGH')" },
	{ name: "untrimmed values", code: "use('long enough', ' long enough', 'long enough ')" },
];

const invalid: InvalidTestCase[] = [
	{
		name: "dynamic import options remain ordinary expressions",
		code: "import('a', { with: { format: 'custom-value' } }); use('custom-value', 'custom-value');",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "dynamic imports and ordinary strings count even when the same path is statically imported",
		code: "import 'example-package';\nimport('example-package');\nuse('example-package');\nuse('example-package');",
		errors: [
			{ occurrences: 3, line: 2, column: 8 },
			{ occurrences: 3, line: 3, column: 5 },
			{ occurrences: 3, line: 4, column: 5 },
		],
	},
	{
		name: "ordinary occurrences of a directive value still count",
		code: "'use strict'; use('use strict', 'use strict'); 'use strict';",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "default threshold",
		code: "use('long enough', 'long enough', 'long enough')",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "explicit defaults",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{}],
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "minimum length boundary",
		code: "use('1234567890', '1234567890', '1234567890')",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "more than the threshold",
		code: "use('long enough', 'long enough', 'long enough', 'long enough')",
		errors: duplicateErrors({ occurrences: 4 }),
	},
	{
		name: "mixed quotes and static templates",
		code: "use('long enough', \"long enough\", `long enough`)",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "decoded escape sequences",
		code: "use('long enough', 'long\\u0020enough', `long enough`)",
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "nested scopes",
		code: readFixture("invalid/nested-scopes.js"),
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "multiple duplicate groups with different counts",
		code: readFixture("invalid/multiple-groups.js"),
		errors: [
			{ occurrences: 3, line: 1, column: 5 },
			{ occurrences: 4, line: 2, column: 5 },
			{ occurrences: 3, line: 3, column: 5 },
			{ occurrences: 4, line: 4, column: 5 },
			{ occurrences: 3, line: 5, column: 5 },
			{ occurrences: 4, line: 6, column: 5 },
			{ occurrences: 4, line: 7, column: 5 },
		],
	},
	{
		name: "excluding one value leaves other duplicates reportable",
		code:
			"use('long enough', 'long enough', 'long enough');\nuse('another string', 'another string', 'another string');",
		options: [{ ignoreStrings: ["long enough"] }],
		errors: [
			{ occurrences: 3, line: 2, column: 5 },
			{ occurrences: 3, line: 2, column: 23 },
			{ occurrences: 3, line: 2, column: 41 },
		],
	},
	{
		name: "lower threshold and shorter strings",
		code: "use('abc', 'abc')",
		options: [{ threshold: 2, shortString: 3 }],
		errors: duplicateErrors({ occurrences: 2 }),
	},
	{
		name: "zero minimum length includes empty strings",
		code: "use('', '', ``)",
		options: [{ shortString: 0 }],
		errors: duplicateErrors({ occurrences: 3 }),
	},
	{
		name: "exclusions are exact, not patterns or substrings",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ ignoreStrings: ["long", "long.*", "Long enough", " long enough "] }],
		errors: duplicateErrors({ occurrences: 3 }),
	},
];

const typescriptValid: TestCase[] = [{
	name: "import assignments and module augmentations do not contribute to the runtime threshold",
	code: [
		"import service = require('example-package');",
		"declare module 'example-package' { interface Api { id: string } }",
		"use('example-package', 'example-package');",
	].join("\n"),
	filename: "input.cts",
}, {
	name: "import types do not contribute to the runtime string threshold",
	code: "type A = import('example-package').A; type B = typeof import('example-package'); import('example-package');",
	filename: "input.ts",
}, {
	name: "typed string below the threshold",
	code: "const message: string = 'long enough'",
	filename: "input.ts",
}];

const typescriptInvalid: InvalidTestCase[] = [{
	name: "ordinary require calls count even alongside an import assignment",
	code:
		"import service = require('example-package');\nrequire('example-package');\nuse('example-package', 'example-package');",
	filename: "input.cts",
	errors: [
		{ occurrences: 3, line: 2, column: 9 },
		{ occurrences: 3, line: 3, column: 5 },
		{ occurrences: 3, line: 3, column: 24 },
	],
}, {
	name: "runtime import and ordinary values still count alongside an import type",
	code: "type A = import('example-package').A; import('example-package'); use('example-package', 'example-package');",
	filename: "input.ts",
	errors: duplicateErrors({ occurrences: 3 }),
}, {
	name: "duplicate strings in typed declarations",
	code: "const a: string = 'long enough'; const b: string = 'long enough'; const c: string = 'long enough';",
	filename: "input.ts",
	errors: duplicateErrors({ occurrences: 3 }),
}];

export { invalid, typescriptInvalid, typescriptValid, valid };
