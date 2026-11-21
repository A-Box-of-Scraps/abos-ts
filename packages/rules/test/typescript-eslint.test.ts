import plugin, { rules as pluginRules } from "#src/index";
import { typescriptInvalid, typescriptValid } from "#test/duplicate-string-cases";
import { parseForESLint } from "@typescript-eslint/parser";
import { Linter } from "eslint";
import { describe, expect, it } from "vitest";

const duplicateRule = "abos/no-duplicate-strings";

function lint(code: string, filename: string, rules: Linter.RulesRecord): Linter.LintMessage[] {
	return new Linter().verify(code, {
		files: ["**/*.{ts,tsx,mts,cts}"],
		languageOptions: { parser: { parseForESLint } },
		plugins: { abos: plugin },
		rules,
	}, filename);
}

describe("rules with the ESLint TypeScript parser", () => {
	it.each(typescriptValid)("allows $name", ({ code, filename, options }) => {
		// Arrange
		expect.hasAssertions();
		const rules: Linter.RulesRecord = { [duplicateRule]: ["error", ...(options ?? [])] };

		// Act
		const messages = lint(code, filename ?? "input.ts", rules);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each(typescriptInvalid)("reports $name", ({ code, filename, options, errors }) => {
		// Arrange
		expect.hasAssertions();
		const rules: Linter.RulesRecord = { [duplicateRule]: ["error", ...(options ?? [])] };

		// Act
		const messages = lint(code, filename ?? "input.ts", rules);

		// Assert
		expect(messages).toMatchObject(errors.map(({ occurrences, ...location }) => ({
			...location,
			ruleId: duplicateRule,
			messageId: "duplicateString",
			message: `This string appears ${occurrences} times. Replace it with a meaningfully named constant.`,
		})));
	});

	it("runs the plugin rules together on a TypeScript module", () => {
		// Arrange
		expect.hasAssertions();
		const rules = Object.fromEntries(Object.keys(pluginRules).map((name) => [`abos/${name}`, "error" as const]));
		const code = [
			"export const retries: number = 3;",
			"const reject = (v: unknown): v is string[] => Array.isArray(v);",
			"if (register(class { accessor ready = a && b })) {}",
			"if (register(class { static accessor ready = a && b })) {}",
			"const complex = a && ((b || c || d || e) as boolean);",
			"const pending = state === ('pending' as const);",
			"use('example-value', 'example-value', 'example-value');",
		].join("\n");

		// Act
		const messages = lint(code, "module.mts", rules);

		// Assert
		expect(messages).toMatchObject([
			{ line: 1, ruleId: "abos/uppercase-primitive-const" },
			{ line: 2, ruleId: "abos/no-shallow-type-predicate" },
			{ line: 4, ruleId: "abos/named-conditions" },
			{ line: 5, ruleId: "abos/expression-complexity" },
			{ line: 6, ruleId: "abos/no-magic-strings" },
			{ line: 7, ruleId: duplicateRule },
			{ line: 7, ruleId: duplicateRule },
			{ line: 7, ruleId: duplicateRule },
		]);
	});
});
