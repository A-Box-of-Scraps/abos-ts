// Assert exact booleans rather than truthiness for the type guard.
/* oxlint-disable vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
import { defineEnum, type EnumMember, type EnumValue, isEnum, parseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

const statusBrand = Symbol("Status");
const status = defineEnum(statusBrand, { Active: "active", Inactive: "inactive", Empty: "" });
type Status = EnumValue<typeof status>;

const invalidInputs: unknown[] = [
	"Active",
	"ACTIVE",
	"missing",
	" active ",
	"toString",
	// oxlint-disable-next-line unicorn/no-null -- External input can contain null.
	null,
	undefined,
	// oxlint-disable-next-line no-magic-numbers -- Exercise a non-string primitive.
	0,
	true,
	{},
	[],
	Symbol("active"),
];

describe("enum definition", () => {
	it("returns a frozen copy without adding runtime properties", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Active: "active", Inactive: "inactive" };

		// Act
		const result = defineEnum(statusBrand, values);

		// Assert
		expect(result).not.toBe(values);
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(values)).toBe(false);
		expect(result).toStrictEqual({ Active: "active", Inactive: "inactive" });
		expect(Object.getOwnPropertySymbols(result)).toStrictEqual([]);
	});

	it("does not change when the original object is mutated", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Active: "active" };
		const result = defineEnum(statusBrand, values);

		// Act
		values.Active = "changed";

		// Assert
		expect(result.Active).toBe("active");
		expect(isEnum(result, "active")).toBe(true);
		expect(isEnum(result, "changed")).toBe(false);
	});

	it("prevents changing, adding, and deleting members at runtime", () => {
		// Arrange
		expect.hasAssertions();
		const result = defineEnum(statusBrand, { Active: "active" });

		// Act
		const changed = Reflect.set(result, "Active", "changed");
		const added = Reflect.set(result, "Inactive", "inactive");
		const deleted = Reflect.deleteProperty(result, "Active");

		// Assert
		expect(changed).toBe(false);
		expect(added).toBe(false);
		expect(deleted).toBe(false);
		expect(result).toStrictEqual({ Active: "active" });
	});

	it("infers readonly branded literal members and their union", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const values = defineEnum(statusBrand, { Active: "active", Inactive: "inactive", Empty: "" });

		// Assert
		expect(values.Active).toBe("active");
		expectTypeOf(values).toEqualTypeOf<{
			readonly Active: EnumMember<"active", typeof statusBrand>;
			readonly Inactive: EnumMember<"inactive", typeof statusBrand>;
			readonly Empty: EnumMember<"", typeof statusBrand>;
		}>();
		expectTypeOf<Status>().toEqualTypeOf<
			| EnumMember<"active", typeof statusBrand>
			| EnumMember<"inactive", typeof statusBrand>
			| EnumMember<"", typeof statusBrand>
		>();
		expectTypeOf<"active">().not.toExtend<Status>();
	});

	it("rejects brands without a unique symbol type", () => {
		// Arrange
		expect.hasAssertions();
		// oxlint-disable-next-line typescript/no-inferrable-types -- Explicit widening exercises rejection of non-unique brands.
		const widenedBrand: symbol = Symbol("Status");

		// Act
		// @ts-expect-error Inline symbols do not preserve a unique symbol type.
		const inline = defineEnum(Symbol("Status"), { Active: "active" });
		// @ts-expect-error Widened symbols cannot distinguish enum domains.
		const widened = defineEnum(widenedBrand, { Active: "active" });

		// Assert
		expect(inline.Active).toBe("active");
		expect(widened.Active).toBe("active");
	});

	it("distinguishes identical literals with different brands", () => {
		// Arrange
		expect.hasAssertions();
		const otherBrand = Symbol("OtherStatus");

		// Act
		const other = defineEnum(otherBrand, { Active: "active" });

		// Assert
		expect(other.Active).toBe(status.Active);
		expectTypeOf(other.Active).not.toExtend<Status>();
	});
});

describe("enum validation", () => {
	it.each(["active", "inactive", ""])("accepts the value %j", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(status, input);

		// Assert
		expect(result).toBe(true);
	});

	it.each(invalidInputs)("rejects invalid input %j", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(status, input);

		// Assert
		expect(result).toBe(false);
	});

	it("narrows unknown input to the branded value union", () => {
		// Arrange
		expect.hasAssertions();
		const input: unknown = "active";

		// Act
		if (!isEnum(status, input)) {
			throw new Error("Expected a valid status");
		}

		// Assert
		expectTypeOf(input).toEqualTypeOf<Status>();
		expect(input).toBe("active");
	});

	it("rejects all inputs for an empty enum", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, {});

		// Act
		const result = isEnum(values, "");

		// Assert
		expect(result).toBe(false);
	});

	it("accepts duplicate values", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { First: "same", Second: "same" });

		// Act
		const result = isEnum(values, "same");

		// Assert
		expect(result).toBe(true);
	});
});

describe("enum parsing", () => {
	it.each(["active", "inactive", ""])("returns %j without creating an error", (input) => {
		// Arrange
		expect.hasAssertions();
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Invalid status"));

		// Act
		const result = parseEnum(status, input, createError);

		// Assert
		expect(result).toBe(input);
		expectTypeOf(result).toEqualTypeOf<Status>();
		expect(createError).not.toHaveBeenCalled();
	});

	it.each(invalidInputs)("throws the supplied error for invalid input %j", (input) => {
		// Arrange
		expect.hasAssertions();
		const error = new TypeError("Invalid status");
		const createError = vi.fn<(input: unknown) => Error>(() => error);

		// Act
		function parse(): Status {
			return parseEnum(status, input, createError);
		}

		// Assert
		expect(parse).toThrow(error);
		expect(createError).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("rejects input for an empty enum", () => {
		// Arrange
		expect.hasAssertions();
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Empty enum"));
		const values = defineEnum(statusBrand, {});

		// Act
		function parse(): never {
			return parseEnum(values, "", createError);
		}

		// Assert
		expect(parse).toThrow("Empty enum");
		expect(createError).toHaveBeenCalledExactlyOnceWith("");
	});
});
