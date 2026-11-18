import plugin, {
	expressionComplexity,
	namedConditions,
	noDuplicateStrings,
	noMagicStrings,
	noShallowTypePredicate,
	rules,
	uppercasePrimitiveConst,
} from "#src/index";
import { describe, expect, it } from "vitest";

describe("plugin exports", () => {
	it.each(
		[
			{ name: "expression-complexity", rule: expressionComplexity },
			{ name: "named-conditions", rule: namedConditions },
			{ name: "no-duplicate-strings", rule: noDuplicateStrings },
			{ name: "no-magic-strings", rule: noMagicStrings },
			{ name: "no-shallow-type-predicate", rule: noShallowTypePredicate },
			{ name: "uppercase-primitive-const", rule: uppercasePrimitiveConst },
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
