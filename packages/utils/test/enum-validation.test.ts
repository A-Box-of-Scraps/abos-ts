// Numeric literals and exact booleans exercise membership without coercion.
/* oxlint-disable no-magic-numbers, vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
import { defineEnum, type EnumValue, isEnum, parseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

const status = defineEnum({ Enabled: "enabled", Disabled: 0, Empty: "" });
type Status = EnumValue<typeof status>;
const validInputs: unknown[] = ["enabled", 0, ""];
const invalidInputs: unknown[] = [
	"Enabled",
	"ENABLED",
	"missing",
	" enabled ",
	"0",
	"toString",
	1,
	true,
	undefined,
	// oxlint-disable-next-line unicorn/no-null -- External inputs can be null.
	null,
	1n,
	Symbol("enabled"),
	{},
	[],
];

describe("enum membership", () => {
	it.each(validInputs)("accepts and narrows member %#", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(status, input);

		// Assert
		expect(result).toBe(true);
		if (!result) {
			throw new Error("Expected a valid status");
		}
		expectTypeOf(input).toEqualTypeOf<Status>();
	});

	it.each(invalidInputs)("rejects non-member %#", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(status, input);

		// Assert
		expect(result).toBe(false);
	});

	it("accepts plain value maps without defineEnum", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Enabled: "enabled" } as const;
		const input: unknown = "enabled";

		// Act
		const result = isEnum(values, input);

		// Assert
		expect(result).toBe(true);
		if (!result) {
			throw new Error("Expected a valid member");
		}
		expectTypeOf(input).toEqualTypeOf<"enabled">();
	});

	it.each(validInputs)("rejects input %# for an empty definition", (input) => {
		// Arrange
		expect.hasAssertions();
		const empty = defineEnum({});

		// Act
		const result = isEnum(empty, input);

		// Assert
		expect(result).toBe(false);
	});
});

describe("enum parsing", () => {
	it.each(validInputs)("returns member %# unchanged without creating an error", (input) => {
		// Arrange
		expect.hasAssertions();
		const createError = vi.fn<(value: unknown) => Error>(() => new Error("Invalid status"));

		// Act
		const result = parseEnum(status, input, createError);

		// Assert
		expect(result).toBe(input);
		expectTypeOf(result).toEqualTypeOf<Status>();
		expect(createError).not.toHaveBeenCalled();
	});

	it.each(invalidInputs)("passes non-member %# unchanged to the error factory", (input) => {
		// Arrange
		expect.hasAssertions();
		const error = new TypeError("Invalid status");
		const createError = vi.fn<(value: unknown) => Error>(() => error);

		// Act
		function parse(): Status {
			return parseEnum(status, input, createError);
		}

		// Assert
		expect(parse).toThrow(error);
		expect(createError).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("throws for empty definitions whose value type is never", () => {
		// Arrange
		expect.hasAssertions();
		const empty = defineEnum({});

		// Act
		function parse(): never {
			return parseEnum(empty, "enabled", () => new Error("Empty enum"));
		}

		// Assert
		expect(parse).toThrow("Empty enum");
	});
});

describe("enum parsing with the default error factory", () => {
	it.each(validInputs)("returns member %# without an error factory", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = parseEnum(status, input);

		// Assert
		expect(result).toBe(input);
		expectTypeOf(result).toEqualTypeOf<Status>();
	});

	it.each(invalidInputs)("throws a TypeError for non-member %#", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		function parse(): Status {
			return parseEnum(status, input);
		}

		// Assert
		expect(parse).toThrow(TypeError);
		expect(parse).toThrow(new TypeError(`Invalid enum value: ${String(input)}`));
	});

	it("uses the default factory when explicitly passed undefined", () => {
		// Arrange
		expect.hasAssertions();
		const input = "missing";

		// Act
		function parse(): Status {
			return parseEnum(status, input, undefined);
		}

		// Assert
		expect(parse).toThrow(TypeError);
	});
});

describe("enum validation edge cases", () => {
	it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -0])(
		"preserves numeric edge case %# during membership checks and parsing",
		(input) => {
			// Arrange
			expect.hasAssertions();
			const values = defineEnum({
				NaN: Number.NaN,
				Infinity: Number.POSITIVE_INFINITY,
				NegativeInfinity: Number.NEGATIVE_INFINITY,
				Zero: 0,
			});

			// Act
			const matches = isEnum(values, input);
			const parsed = parseEnum(values, input, () => new Error("Invalid number"));

			// Assert
			expect(matches).toBe(true);
			expect(parsed).toBe(input);
		},
	);

	it("accepts duplicate values", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ First: "same", Last: "same" });

		// Act
		const matches = isEnum(values, "same");
		const parsed = parseEnum(values, "same", () => new Error("Invalid member"));

		// Assert
		expect(matches).toBe(true);
		expect(parsed).toBe("same");
		expectTypeOf(parsed).toEqualTypeOf<"same">();
	});

	it("preserves values from every branch of a union-shaped definition", () => {
		// Arrange
		expect.hasAssertions();
		type Members = { Enabled: "enabled" } | { Disabled: 0 };
		function createStatus(members: Members): Readonly<Members> {
			return defineEnum(members);
		}
		const enabled = createStatus({ Enabled: "enabled" });
		const disabled = createStatus({ Disabled: 0 });

		// Act
		const text = parseEnum(enabled, "enabled", () => new Error("Invalid status"));
		const number = parseEnum(disabled, 0, () => new Error("Invalid status"));

		// Assert
		expect(text).toBe("enabled");
		expect(number).toBe(0);
		expectTypeOf(text).toEqualTypeOf<"enabled" | 0>();
	});
});
