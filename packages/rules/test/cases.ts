import { readFileSync } from "node:fs";

function readFixture(path: string): string {
	return readFileSync(new URL(`fixtures/no-magic-strings/${path}`, import.meta.url), "utf8");
}

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
	...["undefined", "object", "boolean", "number", "bigint", "string", "symbol", "function"].flatMap((value) => [
		`typeof input === '${value}'`,
		`'${value}' !== typeof input`,
	]),
];

const inlineInvalid = [
	...["===", "!==", "==", "!=", "<", "<=", ">", ">="].flatMap((operator) => [
		{ code: `status ${operator} 'enabled'`, count: 1 },
		{ code: `'enabled' ${operator} status`, count: 1 },
	]),
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
	...["valid/switches.js", "valid/dynamic-templates.js", "valid/typeof.js"].map((name) => ({
		name,
		code: readFixture(name),
	})),
];

const invalid = [
	...inlineInvalid.map(({ code, count }) => ({ name: code, code, count })),
	...[
		{ name: "invalid/switch-cases.js", count: 2 },
		{ name: "invalid/switch-discriminants.js", count: 2 },
		{ name: "invalid/nested-switch.js", count: 1 },
		{ name: "invalid/typeof-switch.js", count: 1 },
		{ name: "invalid/template-comparisons.js", count: 19 },
	].map(({ name, count }) => ({ name, count, code: readFixture(name) })),
];

export { invalid, valid };
