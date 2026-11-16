import plugin, { expressionComplexity, rules } from "#src/index";
import { invalid, valid } from "#test/expression-complexity-cases";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

function lint(code: string, options: unknown[] = []): Linter.LintMessage[] {
	const linter = new Linter();
	return linter.verify(code, {
		plugins: { abos: plugin },
		rules: { "abos/expression-complexity": ["error", ...options] },
	});
}

describe("expression-complexity", () => {
	it.each(valid)("allows $name", ({ code, options }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code, options);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each(invalid)("reports $name", ({ code, options, count, operators, max }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code, options);

		// Assert
		expect(messages).toHaveLength(count);
		for (const message of messages) {
			expect(message).toMatchObject({
				ruleId: "abos/expression-complexity",
				messageId: "tooComplex",
				message:
					`This expression has ${operators} logical operators (maximum ${max}). Split it into meaningfully named boolean variables.`,
			});
			expect(message.fix).toBeUndefined();
			expect(message.suggestions).toBeUndefined();
		}
	});

	it("reports the entire logical expression", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint("if (a && b && c) {}", [{ max: 1 }]);

		// Assert
		expect(messages).toMatchObject([{ line: 1, column: 5, endLine: 1, endColumn: 16 }]);
	});

	// eslint-disable-next-line unicorn/no-null -- Null must be rejected rather than treated as an omitted option.
	it.each([{ max: -1 }, { max: 1.5 }, { max: "2" }, { max: null }, { unknown: true }])(
		"rejects invalid options %j",
		(options) => {
			// Arrange
			expect.hasAssertions();

			// Act
			function lintWithInvalidOptions(): void {
				lint("", [options]);
			}

			// Assert
			expect(lintWithInvalidOptions).toThrow(/Key "abos\/expression-complexity"/);
		},
	);

	it("exports the rule through the plugin and named exports", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const exportedRule = rules["expression-complexity"];

		// Assert
		expect(exportedRule).toBe(expressionComplexity);
		expect(plugin).toMatchObject({ rules });
	});
});
