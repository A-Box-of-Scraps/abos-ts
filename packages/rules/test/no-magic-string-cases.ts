import { readFile } from "node:fs/promises";

function readFixture(path: string): Promise<string> {
	return readFile(new URL(`fixtures/no-magic-strings/${path}`, import.meta.url), "utf8");
}

const typeofResults = ["undefined", "object", "boolean", "number", "bigint", "string", "symbol", "function"];
const comparisonOperators = ["===", "!==", "==", "!=", "<", "<=", ">", ">="];

const inlineValid = [
	"status === ENABLED_STATUS",
	"Status.Pending !== status",
	"input === ''",
	"' ' !== input",
	String.raw`input === '\n\t\r'`,
	String.raw`input === '\u00a0'`,
	"input === ` `",
	"`` === input",
	"const ENABLED_STATUS = 'enabled'",
	"task.status = 'pending'",
	"function run(mode = 'fast') {}",
	"setStatus('pending'); setStatus('pending')",
	"throw new Error('Task not found')",
	"parts.join(', ')",
	"import value from './module'",
	"['pending', 'enabled'].includes(status)",
	"input + 'suffix'",
	"'key' in object",
	"count === 1; value !== null; flag === true; value === /pattern/",
	...typeofResults.flatMap((value) => [
		`typeof input === '${value}'`,
		`'${value}' !== typeof input`,
		`typeof input === \`${value}\``,
	]),
];

// eslint-disable-next-line no-template-curly-in-string -- These strings are source code passed to the parser.
const dynamicTemplate = "`prefix-${id}`";
const dynamicTemplateCases = [
	{ name: "dynamic template comparison", code: `input === ${dynamicTemplate}` },
	{ name: "dynamic template switch case", code: `switch (input) { case ${dynamicTemplate}: break; }` },
	{ name: "dynamic template switch discriminant", code: `switch (${dynamicTemplate}) { case input: break; }` },
	{ name: "tagged template comparison", code: "tag`enabled` === status" },
];

const inlineInvalid = [
	...comparisonOperators.flatMap((operator) => [
		{ code: `status ${operator} 'enabled'`, count: 1 },
		{ code: `'enabled' ${operator} status`, count: 1 },
		{ code: `status ${operator} \`enabled\``, count: 1 },
		{ code: `\`enabled\` ${operator} status`, count: 1 },
	]),
	{ code: '"pending" === `enabled`', count: 2 },
	{ code: "status === `\\u0065nabled`", count: 1 },
	{ code: "switch (typeof input) { case 'strnig': break; }", count: 1 },
	{ code: "status === ' enabled '", count: 1 },
	{ code: String.raw`status === '\u0065nabled'`, count: 1 },
	{ code: "(status) === ('enabled')", count: 1 },
	{ code: "typeof input === 'strnig'", count: 1 },
	{ code: "'strnig' === typeof input", count: 1 },
	{ code: "kind === 'string'", count: 1 },
	{ code: "if (status === 'enabled') {}", count: 1 },
];

const valid = [
	...inlineValid.map((code) => ({ name: code, code })),
	...dynamicTemplateCases,
	...await Promise.all(
		["valid/switches.js", "valid/typeof-switch.js"].map(async (name) => ({ name, code: await readFixture(name) })),
	),
];

const invalid = [
	...inlineInvalid.map(({ code, count }) => ({
		name: code,
		code,
		errors: Array.from({ length: count }, () => ({ messageId: "magicString" })),
	})),
	...await Promise.all([
		{ name: "invalid/switch-cases.js", count: 2 },
		{ name: "invalid/switch-discriminants.js", count: 2 },
	].map(async ({ name, count }) => ({
		name,
		code: await readFixture(name),
		errors: Array.from({ length: count }, () => ({ messageId: "magicString" })),
	}))),
	{
		name: "invalid/nested-switch.js",
		code: await readFixture("invalid/nested-switch.js"),
		errors: [{ messageId: "magicString", line: 2, column: 7, endLine: 2, endColumn: 16 }],
	},
];

const typescriptValid = [
	{ name: "wrapped typeof comparison", code: "(typeof input as string) === ('string' as const)" },
	{ name: "wrapped blank literal", code: "status === (' ' satisfies string)" },
	{ name: "assertion on nonliteral", code: "status === (other as 'enabled')" },
	{ name: "enum member comparison", code: "enum Status { Enabled = 'enabled' }; status === Status.Enabled" },
	{ name: "string literal types", code: "type StatusName = 'pending' | 'enabled'" },
].map(({ name, code }) => ({ name, code, filename: "input.ts" }));

const typescriptInvalid = [
	{ name: "nested assertions in comparison", code: "status === (('running' as const) satisfies string)" },
	{ name: "asserted case label", code: "switch (status) { case <string>'running': break; }" },
	{ name: "asserted switch discriminant", code: "switch (`running`!) {}" },
].map(({ name, code }) => ({ name, code, filename: "input.ts", errors: [{ messageId: "magicString" }] }));

export { invalid, typescriptInvalid, typescriptValid, valid };
