import { readFile } from "node:fs/promises";

interface TestCase {
	name: string;
	code: string;
	filename?: string;
	options?: { max?: number }[];
}

interface InvalidTestCase extends TestCase {
	count: number;
	operators: number;
	max: number;
}

const valid: TestCase[] = [
	{ name: "no logical operators", code: "if (exists) {}" },
	{ name: "default boundary", code: "if (a && b && c && d) {}" },
	{ name: "custom boundary", code: "a || b || c", options: [{ max: 2 }] },
	{ name: "nullish boundary", code: "a ?? b ?? c ?? d" },
	{ name: "negation is not counted", code: "!a && !b", options: [{ max: 1 }] },
	{ name: "zero allows comparisons", code: "a === b", options: [{ max: 0 }] },
	{ name: "bitwise operators are not logical", code: "a & b | c ^ d", options: [{ max: 0 }] },
	{ name: "logical assignments are not counted", code: "a &&= b; c ||= d; e ??= f", options: [{ max: 0 }] },
	{
		name: "extracted boolean variables",
		code: "const isAdminUser = exists && isUser && isAdmin; if (isAdminUser && somethingElse) {}",
		options: [{ max: 2 }],
	},
	{ name: "independent call arguments", code: "check(a && b, c || d)", options: [{ max: 1 }] },
	{ name: "independent function bodies", code: "a && (() => b && c)", options: [{ max: 1 }] },
];

const invalid: InvalidTestCase[] = [
	{ name: "default maximum", code: "a && b && c && d && e", count: 1, operators: 4, max: 3 },
	{ name: "empty options", code: "a || b || c || d || e", options: [{}], count: 1, operators: 4, max: 3 },
	{
		name: "custom maximum exceeded in a condition",
		code: "if (exists && isUser && isAdmin && somethingElse) {}",
		options: [{ max: 2 }],
		count: 1,
		operators: 3,
		max: 2,
	},
	{ name: "nullish operators", code: "a ?? b ?? c ?? d ?? e", count: 1, operators: 4, max: 3 },
	{ name: "mixed operators and parentheses", code: "(a && b) || (c && d) || e", count: 1, operators: 4, max: 3 },
	{ name: "mixed nullish operators", code: "(a ?? b) || (c && d) || e", count: 1, operators: 4, max: 3 },
	{ name: "negated nested expressions", code: "a && !(b || c || d || e)", count: 1, operators: 4, max: 3 },
	{ name: "deep chains report once", code: "a && b && c && d && e && f", count: 1, operators: 5, max: 3 },
	{ name: "zero maximum", code: "a && b", options: [{ max: 0 }], count: 1, operators: 1, max: 0 },
	{
		name: "separate expressions",
		code: await readFile(
			new URL("fixtures/expression-complexity/invalid/separate-expressions.js", import.meta.url),
			"utf8",
		),
		count: 2,
		operators: 4,
		max: 3,
	},
];

const typescriptValid: TestCase[] = [{
	name: "typed expression at the default boundary",
	code: "const allowed: boolean = a && b && c && d",
	filename: "input.ts",
}];

const typescriptInvalid: InvalidTestCase[] = [
	{ name: "as expression", code: "a && ((b || c || d || e) as boolean)" },
	{ name: "satisfies expression", code: "a && ((b || c || d || e) satisfies boolean)" },
	{ name: "type assertion", code: "a && (<boolean>(b || c || d || e))" },
	{ name: "non-null assertion", code: "a && (b || c || d || e)!" },
].map(({ name, code }) => ({ name, code, filename: "input.ts", count: 1, operators: 4, max: 3 }));

export { invalid, typescriptInvalid, typescriptValid, valid };
