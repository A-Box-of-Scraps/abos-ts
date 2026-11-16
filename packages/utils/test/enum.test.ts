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
		expect.hasAssertions();
		const values = { Active: "active", Inactive: "inactive" };
		const result = defineEnum(statusBrand, values);

		expect(result).not.toBe(values);
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(values)).toBe(false);
		expect(result).toStrictEqual({ Active: "active", Inactive: "inactive" });
		expect(Object.getOwnPropertySymbols(result)).toStrictEqual([]);
	});

	it("does not change when the original object is mutated", () => {
		expect.hasAssertions();
		const values = { Active: "active" };
		const result = defineEnum(statusBrand, values);

		values.Active = "changed";

		expect(result.Active).toBe("active");
		expect(isEnum(result, "active")).toBe(true);
		expect(isEnum(result, "changed")).toBe(false);
	});

	it("prevents changing, adding, and deleting members at runtime", () => {
		expect.hasAssertions();
		const result = defineEnum(statusBrand, { Active: "active" });

		expect(Reflect.set(result, "Active", "changed")).toBe(false);
		expect(Reflect.set(result, "Inactive", "inactive")).toBe(false);
		expect(Reflect.deleteProperty(result, "Active")).toBe(false);
		expect(result).toStrictEqual({ Active: "active" });
	});

	it("infers readonly branded literal members and their union", () => {
		expect.hasAssertions();
		expect(status.Active).toBe("active");
		expectTypeOf(status).toEqualTypeOf<{
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
		expect.hasAssertions();
		// oxlint-disable-next-line typescript/no-inferrable-types -- Explicit widening exercises rejection of non-unique brands.
		const widenedBrand: symbol = Symbol("Status");

		// @ts-expect-error Inline symbols do not preserve a unique symbol type.
		const inline = defineEnum(Symbol("Status"), { Active: "active" });
		// @ts-expect-error Widened symbols cannot distinguish enum domains.
		const widened = defineEnum(widenedBrand, { Active: "active" });

		expect(inline.Active).toBe("active");
		expect(widened.Active).toBe("active");
	});

	it("distinguishes identical literals with different brands", () => {
		expect.hasAssertions();
		const otherBrand = Symbol("OtherStatus");
		const other = defineEnum(otherBrand, { Active: "active" });

		expect(other.Active).toBe(status.Active);
		expectTypeOf(other.Active).not.toExtend<Status>();
	});
});

describe("enum validation", () => {
	it.each(["active", "inactive", ""])("accepts the value %j", (input) => {
		expect.hasAssertions();
		expect(isEnum(status, input)).toBe(true);
	});

	it.each(invalidInputs)("rejects invalid input %j", (input) => {
		expect.hasAssertions();
		expect(isEnum(status, input)).toBe(false);
	});

	it("narrows unknown input to the branded value union", () => {
		expect.hasAssertions();
		const input: unknown = "active";
		if (!isEnum(status, input)) {
			throw new Error("Expected a valid status");
		}
		expectTypeOf(input).toEqualTypeOf<Status>();
		expect(input).toBe("active");
	});

	it("rejects all inputs for an empty enum", () => {
		expect.hasAssertions();
		expect(isEnum(defineEnum(statusBrand, {}), "")).toBe(false);
	});

	it("accepts duplicate values", () => {
		expect.hasAssertions();
		const values = defineEnum(statusBrand, { First: "same", Second: "same" });
		expect(isEnum(values, "same")).toBe(true);
	});
});

describe("enum parsing", () => {
	it.each(["active", "inactive", ""])("returns %j without creating an error", (input) => {
		expect.hasAssertions();
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Invalid status"));
		const result = parseEnum(status, input, createError);

		expect(result).toBe(input);
		expectTypeOf(result).toEqualTypeOf<Status>();
		expect(createError).not.toHaveBeenCalled();
	});

	it.each(invalidInputs)("throws the supplied error for invalid input %j", (input) => {
		expect.hasAssertions();
		const error = new TypeError("Invalid status");
		const createError = vi.fn<(input: unknown) => Error>(() => error);

		expect(() => parseEnum(status, input, createError)).toThrow(error);
		expect(createError).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("rejects input for an empty enum", () => {
		expect.hasAssertions();
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Empty enum"));
		expect(() => parseEnum(defineEnum(statusBrand, {}), "", createError)).toThrow("Empty enum");
		expect(createError).toHaveBeenCalledExactlyOnceWith("");
	});
});
