// Numeric fixtures exercise reverse lookup without coercion.
/* oxlint-disable no-magic-numbers */
import { defineEnum, reverseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

const statusBrand = Symbol("Status");
const status = defineEnum(statusBrand, { Active: "active", Pending: 0, Empty: "" });

const validInputs = [
	{ input: "active", expected: "Active" },
	{ input: status.Active, expected: "Active" },
	{ input: 0, expected: "Pending" },
	{ input: status.Pending, expected: "Pending" },
	{ input: "", expected: "Empty" },
];
const invalidInputs: unknown[] = [
	"Active",
	"missing",
	"0",
	1,
	true,
	false,
	undefined,
	// oxlint-disable-next-line unicorn/no-null -- Reverse lookup accepts arbitrary external input.
	null,
	0n,
	Symbol("active"),
	{ Active: "active" },
	["active"],
];

describe("enum reverse lookup", () => {
	it.each(validInputs)("returns $expected for input $input", ({ input, expected }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = reverseEnum(status, input);

		// Assert
		expect(result).toBe(expected);
		expectTypeOf(result).toEqualTypeOf<"Active" | "Pending" | "Empty" | undefined>();
	});

	it.each(invalidInputs)("returns undefined for non-member %# without coercion", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = reverseEnum(status, input);

		// Assert
		expect(result).toBeUndefined();
	});

	it("returns undefined for an empty enum", () => {
		// Arrange
		expect.hasAssertions();
		const empty = defineEnum(statusBrand, {});

		// Act
		const result = reverseEnum(empty, "active");

		// Assert
		expect(result).toBeUndefined();
		expectTypeOf(result).toEqualTypeOf<undefined>();
	});

	it("returns the last key for duplicate string and number values", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { First: "same", Second: "same", Third: 1, Fourth: 1 });

		// Act
		const stringKey = reverseEnum(values, "same");
		const numericKey = reverseEnum(values, values.Third);

		// Assert
		expect(stringKey).toBe("Second");
		expect(numericKey).toBe("Fourth");
	});

	it("returns an empty member name without treating it as a missing match", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { "": "empty" });

		// Act
		const result = reverseEnum(values, "empty");

		// Assert
		expect(result).toBe("");
		expectTypeOf(result).toEqualTypeOf<"" | undefined>();
	});
});

describe("enum reverse lookup edge cases", () => {
	it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
		"matches non-finite numeric value %# and returns the last duplicate",
		(input) => {
			// Arrange
			expect.hasAssertions();
			const values = defineEnum(statusBrand, { First: input, Last: input });

			// Act
			const result = reverseEnum(values, input);

			// Assert
			expect(result).toBe("Last");
		},
	);

	it("matches signed zero like the membership guard", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { Zero: 0 });

		// Act
		const result = reverseEnum(values, -0);

		// Assert
		expect(result).toBe("Zero");
	});

	it("distinguishes string and number members with the same spelling", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { Number: 1, String: "1" });

		// Act
		const numberKey = reverseEnum(values, 1);
		const stringKey = reverseEnum(values, "1");

		// Assert
		expect(numberKey).toBe("Number");
		expect(stringKey).toBe("String");
	});

	it("stringifies numeric keys when given a plain value map", () => {
		// Arrange
		expect.hasAssertions();
		const values = { 0: "zero" };

		// Act
		const result = reverseEnum(values, "zero");

		// Assert
		expect(result).toBe("0");
		expectTypeOf(result).toEqualTypeOf<"0" | undefined>();
	});

	it("ignores symbol keys when given a plain value map", () => {
		// Arrange
		expect.hasAssertions();
		const key = Symbol("Key");
		const values = { [key]: "hidden" };

		// Act
		const result = reverseEnum(values, "hidden");

		// Assert
		expect(result).toBeUndefined();
		expectTypeOf(result).toEqualTypeOf<undefined>();
	});
});
