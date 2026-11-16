import plugin, { expressionComplexity, namedConditions, noDuplicateStrings, noMagicStrings, rules } from "#src/index";
import { describe, expect, it } from "vitest";

describe("plugin exports", () => {
	it.each(
		[
			{ name: "expression-complexity", rule: expressionComplexity },
			{ name: "named-conditions", rule: namedConditions },
			{ name: "no-duplicate-strings", rule: noDuplicateStrings },
			{ name: "no-magic-strings", rule: noMagicStrings },
		] as const,
	)("registers $name", ({ name, rule }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const registered = rules[name];

		// Assert
		expect(registered).toBe(rule);
		expect(plugin).toMatchObject({ rules });
	});
});
