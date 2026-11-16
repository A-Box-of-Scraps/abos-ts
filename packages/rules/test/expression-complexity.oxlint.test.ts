import { expressionComplexity } from "#src/index";
import { invalid, typescriptInvalid, typescriptValid, valid } from "#test/expression-complexity-cases";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = expressionComplexity as unknown as Parameters<RuleTester["run"]>[1];

describe("expression-complexity in Oxlint", () => {
	it.each([...valid, ...typescriptValid])("allows $name", (testCase) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("expression-complexity", oxlintRule, { valid: [testCase], invalid: [] });
		}

		// Assert
		expect(runCase).not.toThrow();
	});

	it.each([...invalid, ...typescriptInvalid])(
		"reports $name",
		({ name, code, options, filename, count, operators, max }) => {
			// Arrange
			expect.hasAssertions();
			const tester = new RuleTester();

			// Act
			function runCase(): void {
				tester.run("expression-complexity", oxlintRule, {
					valid: [],
					invalid: [{
						name,
						code,
						options: options ?? [],
						filename: filename ?? "input.js",
						errors: Array.from({ length: count }, () => ({
							messageId: "tooComplex",
							data: { count: operators, max },
							suggestions: [],
						})),
					}],
				});
			}

			// Assert
			expect(runCase).not.toThrow();
		},
	);
});
