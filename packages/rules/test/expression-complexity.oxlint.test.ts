import { expressionComplexity } from "#src/index";
import { invalid, valid } from "#test/expression-complexity-cases";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = expressionComplexity as unknown as Parameters<RuleTester["run"]>[1];

describe("expression-complexity in Oxlint", () => {
	it("counts logical operators with configurable limits", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();
		const cases = invalid.map(({ name, code, options, count }) => ({
			name,
			code,
			options: options ?? [],
			errors: Array.from({ length: count }, () => ({ messageId: "tooComplex" })),
		}));

		// Act
		function runCases(): void {
			tester.run("expression-complexity", oxlintRule, { valid, invalid: cases });
		}

		// Assert
		expect(runCases).not.toThrow();
	});

	it.each([
		"a && ((b || c || d || e) as boolean)",
		"a && ((b || c || d || e) satisfies boolean)",
		"a && (<boolean>(b || c || d || e))",
		"a && (b || c || d || e)!",
	])("counts through TypeScript wrappers: %s", (code) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

		// Act
		function runCases(): void {
			tester.run("expression-complexity", oxlintRule, {
				valid: ["const allowed: boolean = a && b && c && d"],
				invalid: [{ code, errors: [{ messageId: "tooComplex", data: { count: 4, max: 3 } }] }],
			});
		}

		// Assert
		expect(runCases).not.toThrow();
	});
});
