import plugin, { noDuplicateStrings, rules } from "#src/index";
import { invalid, valid } from "#test/duplicate-string-cases";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

function lint(code: string, options: unknown[] = []): Linter.LintMessage[] {
	const linter = new Linter();
	return linter.verify(code, {
		plugins: { abos: plugin },
		rules: { "abos/no-duplicate-strings": ["error", ...options] },
	});
}

const NON_STRING_EXCLUSION = 1;

describe("no-duplicate-strings", () => {
	it.each(valid)("allows $name", ({ code, options }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code, options);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each(invalid)("reports $name", ({ code, options, count, occurrences }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const messages = lint(code, options);

		// Assert
		expect(messages).toHaveLength(count);
		for (const message of messages) {
			expect(message).toMatchObject({
				ruleId: "abos/no-duplicate-strings",
				messageId: "duplicateString",
				message: `This string appears ${occurrences} times. Replace it with a meaningfully named constant.`,
			});
			expect(message.fix).toBeUndefined();
			expect(message.suggestions).toBeUndefined();
		}
	});

	it("reports each occurrence's location", () => {
		// Arrange
		expect.hasAssertions();
		const code = "use('long enough');\nuse('long enough');\nuse('long enough');";

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject([
			{ line: 1, column: 5, endLine: 1, endColumn: 18 },
			{ line: 2, column: 5, endLine: 2, endColumn: 18 },
			{ line: 3, column: 5, endLine: 3, endColumn: 18 },
		]);
	});

	it("keeps counts local to each file", () => {
		// Arrange
		expect.hasAssertions();
		const linter = new Linter();
		const config: Linter.Config = { plugins: { abos: plugin }, rules: { "abos/no-duplicate-strings": "error" } };
		linter.verify("use('long enough', 'long enough', 'long enough')", config, "first.js");

		// Act
		const messages = linter.verify("use('long enough')", config, "second.js");

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each([
		{ threshold: 1 },
		{ threshold: 2.5 },
		{ threshold: "3" },
		{ shortString: -1 },
		{ shortString: 1.5 },
		{ shortString: "10" },
		{ ignoreStrings: "excluded" },
		{ ignoreStrings: [NON_STRING_EXCLUSION] },
		{ ignoreStrings: ["duplicate", "duplicate"] },
		{ unknown: true },
	])("rejects invalid options %j", (options) => {
		// Arrange
		expect.hasAssertions();

		// Act
		function lintWithInvalidOptions(): void {
			lint("", [options]);
		}

		// Assert
		expect(lintWithInvalidOptions).toThrow(/Key "abos\/no-duplicate-strings"/);
	});

	it("exports the rule through the plugin and named exports", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const exportedRule = rules["no-duplicate-strings"];

		// Assert
		expect(exportedRule).toBe(noDuplicateStrings);
		expect(plugin).toMatchObject({ rules });
	});
});
