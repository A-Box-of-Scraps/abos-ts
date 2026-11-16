import plugin from "#src/index";
import { invalid, valid } from "#test/no-magic-string-cases";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

function lint(code: string): Linter.LintMessage[] {
	const linter = new Linter();
	return linter.verify(code, {
		plugins: { abos: plugin },
		rules: { "abos/no-magic-strings": "error" },
	});
}

describe("no-magic-strings", () => {
	it.each(valid)("allows $name", ({ code }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each(invalid)("reports $name", ({ code, errors }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject(errors.map((error) => ({ ...error, ruleId: "abos/no-magic-strings" })));
		for (const message of messages) {
			expect(message.fix).toBeUndefined();
			expect(message.suggestions).toBeUndefined();
		}
	});

	it("reports the literal's location", () => {
		// Arrange
		expect.hasAssertions();
		const code = 'status === "enabled"';

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject([{ line: 1, column: 12, endLine: 1, endColumn: 21 }]);
	});
});
