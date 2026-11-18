import plugin from "#src/index";
import { Linter } from "eslint";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ruleId = "abos/uppercase-primitive-const";

function readFixture(path: string): string {
	return readFileSync(new URL(`fixtures/uppercase-primitive-const/${path}`, import.meta.url), "utf8");
}

function lint(code: string): Linter.LintMessage[] {
	return new Linter().verify(code, { plugins: { abos: plugin }, rules: { [ruleId]: "error" } });
}

describe("uppercase-primitive-const", () => {
	it.each(["names.js", "initializers.js", "bindings.js"])("allows %s", (file) => {
		// Arrange
		expect.hasAssertions();
		const code = readFixture(`valid/${file}`);

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toStrictEqual([]);
	});

	it.each([
		{
			file: "literals.js",
			names: ["userName", "maxRetries", "debt", "offset", "negativeZero", "enabled", "missing", "big", "path"],
		},
		{ file: "mixed-export.js", names: ["max", "apiUrl"] },
	])("reports only the offending bindings in $file", ({ file, names }) => {
		// Arrange
		expect.hasAssertions();
		const code = readFixture(`invalid/${file}`);

		// Act
		const messages = lint(code);

		// Assert
		expect(messages).toMatchObject(names.map((name) => ({
			ruleId,
			messageId: "uppercaseName",
			message: `Use UPPER_CASE for the top-level constant '${name}'.`,
		})));
	});
});
