import { namedConditions } from "#src/index";
import { invalid, typescriptInvalid, typescriptValid, valid } from "#test/named-condition-cases";
import { toOxlintError } from "#test/oxlint-errors";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = namedConditions as unknown as Parameters<RuleTester["run"]>[1];

describe("named-conditions in Oxlint", () => {
	it.each([...valid, ...typescriptValid])("allows $name", (testCase) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("named-conditions", oxlintRule, { valid: [testCase], invalid: [] });
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
			tester.run("named-conditions", oxlintRule, {
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
