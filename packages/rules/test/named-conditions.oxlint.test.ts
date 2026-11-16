import { namedConditions } from "#src/index";
import { invalid, typescriptInvalid, typescriptValid, valid } from "#test/named-condition-cases";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line typescript/no-unsafe-type-assertion, no-magic-numbers -- Oxlint accepts ESLint rules at runtime, but defines independent types.
const oxlintRule = namedConditions as unknown as Parameters<RuleTester["run"]>[1];

describe("named-conditions in Oxlint", () => {
	it("checks branch and loop conditions", () => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester();
		const cases = invalid.map(({ name, code, messageIds }) => ({
			name,
			code,
			errors: messageIds.map((messageId) => ({ messageId })),
		}));

		// Act
		function runCases(): void {
			tester.run("named-conditions", oxlintRule, { valid, invalid: cases });
		}

		// Assert
		expect(runCases).not.toThrow();
	});

	it.each(typescriptInvalid)("checks TypeScript conditions: $name", ({ name, code, messageIds }) => {
		// Arrange
		expect.hasAssertions();
		const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });

		// Act
		function runCases(): void {
			tester.run("named-conditions", oxlintRule, {
				valid: typescriptValid,
				invalid: [{ name, code, errors: messageIds.map((messageId) => ({ messageId })) }],
			});
		}

		// Assert
		expect(runCases).not.toThrow();
	});
});
