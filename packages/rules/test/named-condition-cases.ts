import { readFileSync } from "node:fs";

function readFixture(path: string): string {
	return readFileSync(new URL(`fixtures/named-conditions/${path}`, import.meta.url), "utf8");
}

const inlineValid = [
	"if (register(class { ready = a && b })) {}",
	"if (isAdmin) {}",
	"switch (value) { case a && b: break; }",
	"if (!isAdmin) {}",
	"if (count > limit) {}",
	"if (value ?? fallback) {}",
	"while (value ?? fallback) {}",
	"do {} while (canContinue())",
	"for (; canContinue();) {}",
	"for (;;) {}",
	"isAdmin ? allow() : deny()",
	"const value = (a ?? b) ? c : d",
	"if (ready) { a && b; } else { c || d; }",
	"while (ready) { a && b; }",
	"do { a || b; } while (ready)",
	"for (let value = a && b; ready; value = c || d) {}",
	"for (const item of a || b) {}",
	"for (const key in a || b) {}",
	"ready ? a && b : c || d",
	"if (a & b) {}",
];

const inlineInvalid = [
	{ code: "if (register(class { [a && b] = value })) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (register(class { static ready = a && b })) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "class C { ready = a && b ? yes : no }", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (exists && isUser && hasPrivileges) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (a || b) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (!(a && b)) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if ((a && b) || (c && d)) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (check(a && b)) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if ((a && b) === expected) {}", errors: [{ messageId: "namedBoolean" }] },
	{ code: "if (a ?? (b || c)) {}", errors: [{ messageId: "namedBoolean" }] },
	{
		code: "if (ready ? a && b : c) {}",
		errors: [{ messageId: "namedBoolean", line: 1, column: 5, endLine: 1, endColumn: 23 }],
	},
	{ code: "while (hasWork && !isCancelled) {}", errors: [{ messageId: "namedPredicate" }] },
	{ code: "do {} while (a || b)", errors: [{ messageId: "namedPredicate" }] },
	{ code: "for (; a && b;) {}", errors: [{ messageId: "namedPredicate" }] },
	{ code: "a && b ? allow() : deny()", errors: [{ messageId: "namedBoolean" }] },
	{ code: "a || b ? allow() : deny()", errors: [{ messageId: "namedBoolean" }] },
	{
		code: "if ((a && b) ? c : d) {}",
		errors: [{ messageId: "namedBoolean", line: 1, column: 6, endLine: 1, endColumn: 12 }],
	},
];

const valid = [
	...inlineValid.map((code) => ({ name: code, code })),
	...[
		"valid/named-boolean.js",
		"valid/loop-predicate.js",
		"valid/function-boundaries.js",
	].map((name) => ({ name, code: readFixture(name) })),
];

const invalid = [
	...inlineInvalid.map(({ code, errors }) => ({ name: code, code, errors })),
	...[
		{ name: "invalid/nested-branches.js", errors: [{ messageId: "namedBoolean" }, { messageId: "namedBoolean" }] },
		{ name: "invalid/nested-loops.js", errors: [{ messageId: "namedPredicate" }, { messageId: "namedBoolean" }] },
		{ name: "invalid/function-boundaries.js", errors: [{ messageId: "namedBoolean" }, { messageId: "namedBoolean" }] },
	].map(({ name, errors }) => ({ name, errors, code: readFixture(name) })),
	{
		name: "invalid/callback-condition.js",
		code: readFixture("invalid/callback-condition.js"),
		errors: [{ messageId: "namedBoolean", line: 3, column: 7, endLine: 3, endColumn: 32 }],
	},
];

const typescriptValid = [{
	name: "instance auto-accessor initializer is deferred",
	code: "if (register(class { accessor ready = a && b })) {}",
	filename: "input.ts",
}, {
	name: "typed named boolean",
	code: "const isAdmin: boolean = exists && isUser; if (isAdmin) { allow(); }",
	filename: "input.ts",
}];

const typescriptInvalid = [
	{ name: "static auto-accessor initializer", code: "if (register(class { static accessor ready = a && b })) {}" },
	{ name: "computed auto-accessor key", code: "if (register(class { accessor [a && b] = value })) {}" },
	{ name: "condition inside accessor initializer", code: "class C { accessor ready = a && b ? yes : no }" },
	{ name: "as expression", code: "if ((exists && isUser) as boolean) { allow(); }" },
	{ name: "satisfies expression", code: "if ((isGuest || isAnonymous) satisfies boolean) { deny(); }" },
	{ name: "type assertion", code: "if (<boolean>(exists && isUser)) { allow(); }" },
	{ name: "non-null assertion", code: "if ((exists && isUser)!) { allow(); }" },
].map(({ name, code }) => ({ name, code, filename: "input.ts", errors: [{ messageId: "namedBoolean" }] }));

export { invalid, typescriptInvalid, typescriptValid, valid };
