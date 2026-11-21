import { noShallowTypePredicate } from "#src/index";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

const ruleName = "no-shallow-type-predicate";
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- The tester uses its own types for ESLint-compatible rules.
const rule = noShallowTypePredicate as unknown as Parameters<RuleTester["run"]>[1];
const filename = "input.ts";
const object = 'typeof v === "object" && v !== null';
const dictionary = `${object} && !Array.isArray(v)`;
const workspace = "interface Workspace { name: string; version: string }";

function guard(type: string, expression: string): string {
	return `const check = (v: unknown): v is ${type} => ${expression};`;
}

describe("no-shallow-type-predicate reports", () => {
	it.each([
		{
			name: "required field in local alias",
			code: `type W = { id: string }; function test(v: unknown): v is W { return ${object}; }`,
			messageId: "uncheckedFields",
		},
		{
			name: "interface declared after guard",
			code: `${guard("Workspace", dictionary)} ${workspace}`,
			messageId: "uncheckedFields",
		},
		{
			name: "inline required field, reversed comparisons",
			code: guard("{ id: string }", 'null != v && "object" == typeof v'),
			messageId: "uncheckedFields",
		},
		{ name: "object check for an array", code: guard("string[]", object), messageId: "uncheckedArray" },
		{
			name: "object check for readonly array",
			code: guard("ReadonlyArray<unknown>", object),
			messageId: "uncheckedArray",
		},
		{
			name: "primitive union elements",
			code: guard("(string | number)[]", "Array.isArray(v)"),
			messageId: "uncheckedElements",
		},
		{ name: "string array", code: guard("string[]", "Array.isArray(v)"), messageId: "uncheckedElements" },
		{
			name: "array check after redundant object and null checks",
			code: guard("string[]", `${object} && Array.isArray(v)`),
			messageId: "uncheckedElements",
		},
		{
			name: "array check before redundant null check",
			code: guard("string[]", "Array.isArray(v) && null != v"),
			messageId: "uncheckedElements",
		},
		{
			name: "function expression with any input",
			code: "const check = function(v: any): v is Array<number> { return Array.isArray(v); };",
			messageId: "uncheckedElements",
		},
		{ name: "readonly array", code: guard("readonly string[]", "Array.isArray(v)"), messageId: "uncheckedElements" },
		{
			name: "array of local objects",
			code: `${workspace} ${guard("ReadonlyArray<Workspace>", "Array.isArray(v)")}`,
			messageId: "uncheckedElements",
		},
		{ name: "dictionary of numbers", code: guard("Record<string, number>", dictionary), messageId: "uncheckedValues" },
	])("reports $name", ({ code, messageId }) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function lint(): void {
			tester.run(ruleName, rule, {
				valid: [],
				invalid: [{ code, filename, errors: [{ messageId, suggestions: [] }] }],
			});
		}

		// Assert
		expect(lint).not.toThrow();
	});
});

describe("no-shallow-type-predicate exclusions", () => {
	it.each([
		{ name: "unconstrained dictionary", code: guard("Record<string, unknown>", dictionary) },
		{ name: "union including unknown", code: guard("Array<number | unknown>", "Array.isArray(v)") },
		{ name: "shadowed Array type", code: `type Array<T> = object; ${guard("Array<number>", object)}` },
		{ name: "unconstrained arrays", code: guard("unknown[]", "Array.isArray(v)") },
		{ name: "unknown array alias", code: `type Anything = unknown; ${guard("Anything[]", "Array.isArray(v)")}` },
		{ name: "object", code: guard("object", object) },
		{ name: "optional fields only", code: guard("{ id?: string }", object) },
		{ name: "narrow input", code: "function test(v: number | string[]): v is string[] { return Array.isArray(v); }" },
		{ name: "contradictory array checks", code: guard("string[]", "Array.isArray(v) && !Array.isArray(v)") },
		{ name: "checks elements", code: guard("string[]", 'Array.isArray(v) && v.every(x => typeof x === "string")') },
		{ name: "checks a field", code: `${workspace} ${guard("Workspace", `${object} && "name" in v`)}` },
		{ name: "delegate", code: `${workspace} ${guard("Workspace", "schema.safeParse(v).success")}` },
		{
			name: "multiple statements",
			code:
				`${workspace} function f(v: unknown): v is Workspace { if (!schema.check(v)) return false; return ${object}; }`,
		},
		{
			name: "assertion signature",
			code: "function assert(v: unknown): asserts v is string[] { if (!Array.isArray(v)) throw Error(); }",
		},
		{ name: "function signature only", code: "type Check = (v: unknown) => v is string[];" },
		{ name: "shadowed Array value", code: `const Array = schema; ${guard("number[]", "Array.isArray(v)")}` },
		{
			name: "shadowed Record type",
			code: `type Record<K, V> = object; ${guard("Record<string, number>", dictionary)}`,
		},
		{ name: "unresolved imported target", code: `import type { W } from './other'; ${guard("W", object)}` },
		{
			name: "different parameter",
			code: "const f = (v: unknown, other: unknown): v is number[] => Array.isArray(other);",
		},
		{
			name: "additional object checks",
			code: guard("Record<string, number>", `${object} && Object.values(v).every(isNumber)`),
		},
	])("leaves $name alone", ({ code }) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function lint(): void {
			tester.run(ruleName, rule, { valid: [{ code, filename }], invalid: [] });
		}

		// Assert
		expect(lint).not.toThrow();
	});
});
