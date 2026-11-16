import { readFileSync } from "node:fs";

function readFixture(path: string): string {
	return readFileSync(new URL(`fixtures/named-conditions/${path}`, import.meta.url), "utf8");
}

const inlineValid = [
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
	{ code: "if (exists && isUser && hasPrivileges) {}", messageIds: ["namedBoolean"] },
	{ code: "if (a || b) {}", messageIds: ["namedBoolean"] },
	{ code: "if (!(a && b)) {}", messageIds: ["namedBoolean"] },
	{ code: "if ((a && b) || (c && d)) {}", messageIds: ["namedBoolean"] },
	{ code: "if (check(a && b)) {}", messageIds: ["namedBoolean"] },
	{ code: "if ((a && b) === expected) {}", messageIds: ["namedBoolean"] },
	{ code: "if (a ?? (b || c)) {}", messageIds: ["namedBoolean"] },
	{ code: "if (ready ? a && b : c) {}", messageIds: ["namedBoolean"] },
	{ code: "while (hasWork && !isCancelled) {}", messageIds: ["namedPredicate"] },
	{ code: "do {} while (a || b)", messageIds: ["namedPredicate"] },
	{ code: "for (; a && b;) {}", messageIds: ["namedPredicate"] },
	{ code: "a && b ? allow() : deny()", messageIds: ["namedBoolean"] },
	{ code: "a || b ? allow() : deny()", messageIds: ["namedBoolean"] },
	{ code: "if ((a && b) ? c : d) {}", messageIds: ["namedBoolean"] },
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
	...inlineInvalid.map(({ code, messageIds }) => ({ name: code, code, messageIds })),
	...[
		{ name: "invalid/nested-branches.js", messageIds: ["namedBoolean", "namedBoolean"] },
		{ name: "invalid/nested-loops.js", messageIds: ["namedPredicate", "namedBoolean"] },
		{ name: "invalid/function-boundaries.js", messageIds: ["namedBoolean", "namedBoolean"] },
	].map(({ name, messageIds }) => ({ name, messageIds, code: readFixture(name) })),
];

const typescriptValid = [{ name: "valid/named-boolean.ts", code: readFixture("valid/named-boolean.ts") }];
const typescriptInvalid = [{
	name: "invalid/type-wrappers.ts",
	code: readFixture("invalid/type-wrappers.ts"),
	messageIds: ["namedBoolean", "namedBoolean", "namedBoolean", "namedBoolean"],
}];

export { invalid, typescriptInvalid, typescriptValid, valid };
