import { noMagicStrings } from "#src/index";
import { invalid, typescriptInvalid, typescriptValid, valid } from "#test/no-magic-string-cases";
import { toOxlintError } from "#test/oxlint-errors";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = noMagicStrings as unknown as Parameters<RuleTester["run"]>[1];

describe("no-magic-strings in Oxlint", () => {
	it.each([...valid, ...typescriptValid])("allows $name", (testCase) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("no-magic-strings", oxlintRule, { valid: [testCase], invalid: [] });
		}

		// Assert
		expect(runCase).not.toThrow();
	});

	it.each([...invalid, ...typescriptInvalid])("reports $name", (testCase) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("no-magic-strings", oxlintRule, {
				valid: [],
				invalid: [{
					...testCase,
					errors: testCase.errors.map(toOxlintError),
				}],
			});
		}

		// Assert
		expect(runCase).not.toThrow();
	});
});
