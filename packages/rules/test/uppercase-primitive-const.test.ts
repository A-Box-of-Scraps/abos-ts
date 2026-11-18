import plugin from "#src/index";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

const ruleId = "abos/uppercase-primitive-const";

function lint(code: string): Linter.LintMessage[] {
	return new Linter().verify(code, { plugins: { abos: plugin }, rules: { [ruleId]: "error" } });
}

describe("uppercase-primitive-const", () => {
	it.each([
		'const userName = "Toto";',
		"export const maxRetries = 3;",
		"const enabled = false;",
		"const missing = null;",
		"const big = 123n;",
		"const path = `/api`;",
	])("reports a primitive literal: %s", (code) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject([{ ruleId, messageId: "uppercaseName" }]);
	});

	it.each([
		'const USER_NAME = "Toto", HEALTH = 100, HTTP_2 = true;',
		"const userName = user.name, user = getUser(), alias = HEALTH;",
		"const config = { debug: true }, items = [], handleClick = () => {};",
		"const pattern = /api/, empty = undefined, key = Symbol();",
		`const sum = 1 + 2, label = \`item \${sum}\`;`,
		"const { length } = 'Toto', [first] = 'ok';",
		"let health = 100; var enabled = true;",
		"function run() { const local = 1; } { const scoped = false; }",
		"for (const start = 0; start < 1;) break;",
		"const UPPER_OBJECT = {}; export { UPPER_OBJECT };",
	])("leaves nonviolations alone: %s", (code) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it("checks each binding of an exported declaration independently", () => {
		// Arrange
		expect.hasAssertions();
		const code = "export const ON = true, user = getUser(), max = 3, apiUrl = '/api';";

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject([
			{ ruleId, message: "Use UPPER_CASE for 'max', a top-level const initialized with a primitive literal." },
			{ ruleId, message: "Use UPPER_CASE for 'apiUrl', a top-level const initialized with a primitive literal." },
		]);
	});
});
