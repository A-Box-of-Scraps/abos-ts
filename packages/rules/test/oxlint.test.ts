import { noMagicStrings } from "#src/index";
import { invalid, valid } from "#test/cases";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = noMagicStrings as unknown as Parameters<RuleTester["run"]>[1];

const typescriptCases = [
	"enum Status { Enabled = 'enabled' }; status === Status.Enabled",
	"type StatusName = 'pending' | 'enabled'",
];

describe("no-magic-strings in Oxlint", () => {
	it("accepts allowed JavaScript and TypeScript", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

		// Act
		function runCases(): void {
			tester.run("no-magic-strings", oxlintRule, {
				valid: [...valid, ...typescriptCases],
				invalid: [],
			});
		}

		// Assert
		expect(runCases).not.toThrow();
	});

	it("reports magic strings without autofixes", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();
		const cases = invalid.map(({ name, code, count }) => ({
			name,
			code,
			errors: Array.from({ length: count }, () => ({ messageId: "magicString" })),
		}));

		// Act
		function runCases(): void {
			tester.run("no-magic-strings", oxlintRule, { valid: [], invalid: cases });
		}

		// Assert
		expect(runCases).not.toThrow();
	});
});
