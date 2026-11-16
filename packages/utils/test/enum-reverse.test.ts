// Numeric literals exercise reverse lookup without coercion.
/* oxlint-disable no-magic-numbers */
import { defineEnum, reverseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

const status = defineEnum({ Enabled: "enabled", Disabled: 0, Empty: "" });

describe("enum reverse lookup", () => {
	it.each([
		{ input: "enabled", expected: "Enabled" },
		{ input: 0, expected: "Disabled" },
		{ input: "", expected: "Empty" },
	])("returns $expected for $input", ({ input, expected }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = reverseEnum(status, input);

		// Assert
		expect(result).toBe(expected);
		expectTypeOf(result).toEqualTypeOf<"Enabled" | "Disabled" | "Empty" | undefined>();
	});

	it.each(["Enabled", "missing", "0", 1, false, undefined, 0n, Symbol("enabled"), {}, []])(
		"returns undefined for non-member %#",
		(input) => {
			// Arrange
			expect.hasAssertions();

			// Act
			const result = reverseEnum(status, input);

			// Assert
			expect(result).toBeUndefined();
		},
	);

	it("returns undefined for an empty definition", () => {
		// Arrange
		expect.hasAssertions();
		const empty = defineEnum({});

		// Act
		const result = reverseEnum(empty, "enabled");

		// Assert
		expect(result).toBeUndefined();
		expectTypeOf(result).toEqualTypeOf<undefined>();
	});

	it("returns the last member for duplicate string and numeric values", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ First: "same", Last: "same", Zero: 0, OtherZero: 0 });

		// Act
		const text = reverseEnum(values, "same");
		const number = reverseEnum(values, 0);

		// Assert
		expect(text).toBe("Last");
		expect(number).toBe("OtherZero");
	});

	it("distinguishes string and numeric values with the same spelling", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Text: "0", Number: 0 });

		// Act
		const text = reverseEnum(values, "0");
		const number = reverseEnum(values, 0);

		// Assert
		expect(text).toBe("Text");
		expect(number).toBe("Number");
	});
});

describe("enum reverse lookup edge cases", () => {
	it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
		"matches non-finite number %# and returns its last duplicate",
		(input) => {
			// Arrange
			expect.hasAssertions();
			const values = defineEnum({ First: input, Last: input });

			// Act
			const result = reverseEnum(values, input);

			// Assert
			expect(result).toBe("Last");
		},
	);

	it("matches signed zero", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Zero: 0 });

		// Act
		const result = reverseEnum(values, -0);

		// Assert
		expect(result).toBe("Zero");
	});

	it("preserves empty names and stringifies numeric names", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ "": "empty", 0: "zero" });

		// Act
		const empty = reverseEnum(values, "empty");
		const numeric = reverseEnum(values, "zero");

		// Assert
		expect(empty).toBe("");
		expect(numeric).toBe("0");
		expectTypeOf(numeric).toEqualTypeOf<"" | "0" | undefined>();
	});

	it("ignores symbol keys in plain value maps", () => {
		// Arrange
		expect.hasAssertions();
		const key = Symbol("Hidden");
		const values = { [key]: "hidden" };

		// Act
		const result = reverseEnum(values, "hidden");

		// Assert
		expect(result).toBeUndefined();
		expectTypeOf(result).toEqualTypeOf<undefined>();
	});

	it("preserves names from every branch of a union-shaped definition", () => {
		// Arrange
		expect.hasAssertions();
		type Members = { Enabled: "enabled" } | { Disabled: 0 };
		function createStatus(members: Members): Readonly<Members> {
			return defineEnum(members);
		}
		const values = createStatus({ Disabled: 0 });

		// Act
		const result = reverseEnum(values, 0);

		// Assert
		expect(result).toBe("Disabled");
		expectTypeOf(result).toEqualTypeOf<"Enabled" | "Disabled" | undefined>();
	});
});
