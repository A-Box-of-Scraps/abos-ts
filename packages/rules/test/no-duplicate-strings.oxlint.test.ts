import { noDuplicateStrings } from "#src/index";
import { invalid, typescriptInvalid, typescriptValid, valid } from "#test/duplicate-string-cases";
import { toOxlintError } from "#test/oxlint-errors";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = noDuplicateStrings as unknown as Parameters<RuleTester["run"]>[1];

describe("no-duplicate-strings in Oxlint", () => {
	it.each([...valid, ...typescriptValid])("allows $name", (testCase) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("no-duplicate-strings", oxlintRule, { valid: [testCase], invalid: [] });
		}

		// Assert
		expect(runCase).not.toThrow();
	});

	it.each([...invalid, ...typescriptInvalid])("reports $name", ({ name, code, options, filename, errors }) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();

		// Act
		function runCase(): void {
			tester.run("no-duplicate-strings", oxlintRule, {
				valid: [],
				invalid: [{
					name,
					code,
					options: options ?? [],
					filename: filename ?? "input.js",
					errors: errors.map(({ occurrences, ...location }) => toOxlintError({
						...location,
						messageId: "duplicateString",
						data: { count: occurrences },
					})),
				}],
			});
		}

		// Assert
		expect(runCase).not.toThrow();
	});
});
