import plugin, { namedConditions, rules } from "#src/index";
import { invalid, valid } from "#test/named-condition-cases";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

function lint(code: string): Linter.LintMessage[] {
	const linter = new Linter();
	return linter.verify(code, {
		plugins: { abos: plugin },
		rules: { "abos/named-conditions": "error" },
	});
}

describe("named-conditions", () => {
	it.each(valid)("allows $name", ({ code }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const diagnostics = lint(code);

		// Assert
		expect(diagnostics).toStrictEqual([]);
	});

	it.each(invalid)("reports $name", ({ code, messageIds }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const diagnostics = lint(code);

		// Assert
		expect(diagnostics.map(({ messageId }) => messageId)).toStrictEqual(messageIds);
		for (const diagnostic of diagnostics) {
			expect(diagnostic.ruleId).toBe("abos/named-conditions");
			expect(diagnostic.fix).toBeUndefined();
			expect(diagnostic.suggestions).toBeUndefined();
		}
	});

	it("highlights the whole condition and requests a meaningful name", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const diagnostics = lint("if (a && b || c) {}");

		// Assert
		expect(diagnostics).toMatchObject([{
			line: 1,
			column: 5,
			endLine: 1,
			endColumn: 16,
			message: "Extract this condition into a meaningfully named boolean variable or predicate.",
		}]);
	});

	it("explains that loop conditions must be reevaluated", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const diagnostics = lint("while (a && b) {}");

		// Assert
		expect(diagnostics).toMatchObject([{
			message: "Extract this loop condition into a meaningfully named predicate so it is reevaluated each iteration.",
		}]);
	});

	it("registers the named export in the plugin", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const registered = rules["named-conditions"];

		// Assert
		expect(registered).toBe(namedConditions);
		expect(plugin).toMatchObject({ rules });
	});
});
