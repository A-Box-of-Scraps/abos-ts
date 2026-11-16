import { noDuplicateStrings } from "#src/index";
import { invalid, valid } from "#test/duplicate-string-cases";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = noDuplicateStrings as unknown as Parameters<RuleTester["run"]>[1];

describe("no-duplicate-strings in Oxlint", () => {
	it("checks JavaScript strings with configurable thresholds and exclusions", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();
		const cases = invalid.map(({ name, code, options, count }) => ({
			name,
			code,
			options: options ?? [],
			errors: Array.from({ length: count }, () => ({ messageId: "duplicateString" })),
		}));

		// Act
		function runCases(): void {
			tester.run("no-duplicate-strings", oxlintRule, { valid, invalid: cases });
		}

		// Assert
		expect(runCases).not.toThrow();
	});

	it("counts strings in TypeScript files", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

		// Act
		function runCases(): void {
			tester.run("no-duplicate-strings", oxlintRule, {
				valid: ["const message: string = 'long enough'"],
				invalid: [{
					code: "const a: string = 'long enough'; const b: string = 'long enough'; const c: string = 'long enough';",
					errors: [
						{ messageId: "duplicateString" },
						{ messageId: "duplicateString" },
						{ messageId: "duplicateString" },
					],
				}],
			});
		}

		// Assert
		expect(runCases).not.toThrow();
	});
});
