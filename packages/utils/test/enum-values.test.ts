// Assert exact booleans rather than truthiness for the type guard.
/* oxlint-disable vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
// Numeric literals exercise literal inference and membership without coercion.
/* oxlint-disable no-magic-numbers */
import { defineEnum, type EnumMember, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

const valueBrand = Symbol("Values");
const values = defineEnum(valueBrand, {
	Pending: 0,
	Enabled: "enabled",
	NotANumber: Number.NaN,
	Infinity: Number.POSITIVE_INFINITY,
});
type Value = EnumValue<typeof values>;

const validInputs: unknown[] = [0, "enabled", Number.NaN, Number.POSITIVE_INFINITY];
const invalidInputs: unknown[] = [
	// oxlint-disable-next-line unicorn/no-null -- Null must not match an enum member.
	null,
	undefined,
	"Pending",
	"0",
	true,
	false,
	1n,
	1,
	0n,
	Symbol("token"),
	{ retries: 3, timeout: 1000 },
	[1, 2, 3],
	(): string => "result",
	new Date(0),
];

describe("mixed enum definition", () => {
	it("infers readonly branded string and number literals", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = defineEnum(valueBrand, { Pending: 0, Enabled: "enabled" });

		// Assert
		expect(result).toStrictEqual({ Pending: 0, Enabled: "enabled" });
		expectTypeOf(result).toEqualTypeOf<{
			readonly Pending: EnumMember<0, typeof valueBrand>;
			readonly Enabled: EnumMember<"enabled", typeof valueBrand>;
		}>();
	});

	it("rejects members other than strings and numbers", () => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("RejectedValues");

		// Act
		function rejectMembers(input: { Mixed: string | boolean }): void {
			// @ts-expect-error Boolean members are not supported.
			defineEnum(brand, { Active: true });
			// @ts-expect-error Bigint members are not supported.
			defineEnum(brand, { Big: 1n });
			// @ts-expect-error Symbol members are not supported.
			defineEnum(brand, { Token: Symbol("token") });
			// @ts-expect-error Object members are not supported.
			defineEnum(brand, { Config: { retries: 3 } });
			// @ts-expect-error Array members are not supported.
			defineEnum(brand, { Values: [1, 2, 3] });
			// @ts-expect-error Function members are not supported.
			defineEnum(brand, { Callback: (): string => "result" });
			// @ts-expect-error Date members are not supported.
			defineEnum(brand, { Date: new Date(0) });
			// @ts-expect-error Every branch of a member union must be a string or number.
			defineEnum(brand, { Mixed: input.Mixed });
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});

	it("rejects nullish and broad member types", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const brand = Symbol("RejectedValues");
		function rejectMembers(input: {
			Nullable: number | null;
			Undefined: number | undefined;
			Unknown: unknown;
			// oxlint-disable-next-line typescript/no-explicit-any -- Exercise rejection of any members and containers.
			Any: any;
			Optional?: number;
		}): void {
			// @ts-expect-error Null is not a string or number.
			defineEnum(brand, { Null: null }); // oxlint-disable-line unicorn/no-null -- Exercise rejection of null members.
			// @ts-expect-error Undefined is not a string or number.
			defineEnum(brand, { Undefined: undefined });
			// @ts-expect-error Nullable unions include an unsupported member type.
			defineEnum(brand, { Nullable: input.Nullable });
			// @ts-expect-error Unions with undefined include an unsupported member type.
			defineEnum(brand, { Undefined: input.Undefined });
			// @ts-expect-error Unknown members would erase the enum's type safety.
			defineEnum(brand, { Unknown: input.Unknown });
			// @ts-expect-error Any members would erase the enum's type safety.
			defineEnum(brand, { Any: input.Any }); // oxlint-disable-line typescript/no-unsafe-assignment -- Exercise rejection of any.
			// @ts-expect-error An any container would bypass member validation.
			defineEnum(brand, input.Any); // oxlint-disable-line typescript/no-unsafe-argument -- Exercise rejection of any.
			// @ts-expect-error An unknown container cannot define known members.
			defineEnum(brand, input.Unknown);
			const optional: { Optional?: number } = input;
			// @ts-expect-error Optional members include undefined when accessed.
			defineEnum(brand, optional);
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});
});

describe("enum member names", () => {
	it("rejects symbol keys, including when mixed with string keys", () => {
		// Arrange
		expect.hasAssertions();
		const key = Symbol("Key");

		// Act
		function rejectKeys(): void {
			// @ts-expect-error Symbol keys are not enumerated by the membership check.
			defineEnum(valueBrand, { [key]: 42 });
			// @ts-expect-error A string key must not hide an unsupported symbol key.
			defineEnum(valueBrand, { Name: "hello", [key]: 42 });
			const members = { [key]: 42 };
			// @ts-expect-error Predeclared objects must also reject symbol keys.
			defineEnum(valueBrand, members);
		}

		// Assert
		expect(rejectKeys).toBeTypeOf("function");
	});

	it("rejects numeric names and names that are not statically known", () => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("InvalidNames");

		// Act
		function rejectKeys(input: Record<string, number>): void {
			// @ts-expect-error Native enums cannot have numeric member names.
			defineEnum(brand, { 0: 42 });
			// @ts-expect-error Quoting a canonical numeric name does not make it valid.
			defineEnum(brand, { "0": 42 });
			// @ts-expect-error Negative numeric names are also invalid.
			defineEnum(brand, { "-1": 42 });
			// @ts-expect-error Fractional numeric names are also invalid.
			defineEnum(brand, { "1.5": 42 });
			// @ts-expect-error Native enums require statically known member names.
			defineEnum(brand, input);
		}

		// Assert
		expect(rejectKeys).toBeTypeOf("function");
	});

	it("accepts noncanonical numeric spellings as string names", () => {
		// Arrange
		expect.hasAssertions();
		const members = { "01": 1, "1.0": 2, "1e3": 3, "-0": 4, "": 5, NaN: 6, Infinity: 7 } as const;

		// Act
		const result = defineEnum(valueBrand, members);

		// Assert
		expect(result).toStrictEqual(members);
		expect(isEnum(result, 1)).toBe(true);
		expect(isEnum(result, "01")).toBe(false);
	});
});

describe("enum member initializers", () => {
	it("rejects broad string members and unions containing string", () => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("BroadStrings");

		// Act
		function rejectMembers(input: { Name: string; Count: number; Mixed: string | number }): void {
			// @ts-expect-error A broad string is not a constant string member.
			defineEnum(brand, { Name: input.Name });
			// @ts-expect-error Numeric members must not hide a broad string member.
			defineEnum(brand, { Name: input.Name, Count: input.Count });
			// @ts-expect-error A union containing broad string is also unsupported.
			defineEnum(brand, { Mixed: input.Mixed });
			const members = { Name: "hello" };
			// @ts-expect-error Mutable object properties widen to string unless explicitly narrowed.
			defineEnum(brand, members);
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});

	it("rejects string unions and mixed string/number unions", () => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("StringUnions");

		// Act
		function rejectMembers(input: { Text: "a" | "b"; Mixed: "a" | 1; Nullable: "a" | undefined }): void {
			// @ts-expect-error A string union does not identify a single constant member.
			defineEnum(brand, { Name: input.Text });
			// @ts-expect-error Adding a numeric branch does not make a string initializer constant.
			defineEnum(brand, { Name: input.Mixed });
			// @ts-expect-error Removing undefined must not make a nullable initializer valid.
			defineEnum(brand, { Name: input.Nullable });
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});

	it("accepts broad numeric members alongside string literals", () => {
		// Arrange
		expect.hasAssertions();
		const count = Number("42");

		// Act
		const result = defineEnum(valueBrand, { Name: "hello", Count: count });

		// Assert
		expectTypeOf(result).toEqualTypeOf<{
			readonly Name: EnumMember<"hello", typeof valueBrand>;
			readonly Count: EnumMember<number, typeof valueBrand>;
		}>();
		expect(isEnum(result, 42)).toBe(true);
		expect(isEnum(result, 43)).toBe(false);
		expect(isEnum(result, "42")).toBe(false);
	});

	it("accepts numeric unions as computed numeric members", () => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("NumericUnion");
		function defineCount(count: 1 | 2): { readonly Count: EnumMember<1 | 2, typeof brand> } {
			return defineEnum(brand, { Count: count });
		}

		// Act
		const result = defineCount(1);

		// Assert
		expect(result.Count).toBe(1);
		expect(isEnum(result, 1)).toBe(true);
		expect(isEnum(result, 2)).toBe(false);
	});
});

describe("computed enum members", () => {
	it("supports bit flags while validating only declared values", () => {
		// Arrange
		expect.hasAssertions();
		const read = 1 << 0;
		const write = 1 << 1;
		const execute = 1 << 2;

		// Act
		const permission = defineEnum(valueBrand, {
			None: 0,
			Read: read,
			Write: write,
			Execute: execute,
			All: read | write | execute,
		});

		// Assert
		expect(permission).toStrictEqual({ None: 0, Read: 1, Write: 2, Execute: 4, All: 7 });
		expectTypeOf(permission.Read).toEqualTypeOf<EnumMember<number, typeof valueBrand>>();
		expect(isEnum(permission, read | write | execute)).toBe(true);
		expect(isEnum(permission, read | write)).toBe(false);
		expect(reverseEnum(permission, permission.All)).toBe("All");
	});
});

describe("mixed enum branding", () => {
	it("keeps branded primitive members inhabitable", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type Member = EnumValue<typeof values>;

		// Assert
		expect(values.Pending).toBe(0);
		expectTypeOf<Extract<Member, number>>().not.toBeNever();
		expectTypeOf<Extract<Member, string>>().not.toBeNever();
		expectTypeOf<Member>().toExtend<string | number>();
	});

	it("rejects unbranded values and values from another enum", () => {
		// Arrange
		expect.hasAssertions();
		const otherBrand = Symbol("OtherValues");
		const members = { Number: 0, String: "enabled" } as const;

		// Act
		const first = defineEnum(valueBrand, members);
		const second = defineEnum(otherBrand, members);

		// Assert
		expect(first).toStrictEqual(second);
		expectTypeOf<EnumValue<typeof members>>().not.toExtend<EnumValue<typeof first>>();
		expectTypeOf<EnumValue<typeof second>>().not.toExtend<EnumValue<typeof first>>();
	});
});

describe("mixed enum validation", () => {
	it.each(validInputs)("accepts member %# and narrows its type", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(values, input);

		// Assert
		expect(result).toBe(true);
		if (!result) {
			throw new Error("Expected a valid member");
		}
		expectTypeOf(input).toEqualTypeOf<Value>();
	});

	it.each(invalidInputs)("rejects non-member %# without coercion", (input) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = isEnum(values, input);

		// Assert
		expect(result).toBe(false);
	});

	it.each(validInputs)("rejects input %# for an empty enum", (input) => {
		// Arrange
		expect.hasAssertions();
		const empty = defineEnum(valueBrand, {});

		// Act
		const result = isEnum(empty, input);

		// Assert
		expect(result).toBe(false);
	});

	it("matches signed zero using the existing includes semantics", () => {
		// Arrange
		expect.hasAssertions();
		const zero = defineEnum(valueBrand, { Zero: 0 });

		// Act
		const result = isEnum(zero, -0);

		// Assert
		expect(result).toBe(true);
	});
});

describe("mixed enum parsing", () => {
	it.each(validInputs)("returns member %# unchanged without creating an error", (input) => {
		// Arrange
		expect.hasAssertions();
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Invalid member"));

		// Act
		const result = parseEnum(values, input, createError);

		// Assert
		expect(result).toBe(input);
		expectTypeOf(result).toEqualTypeOf<Value>();
		expect(createError).not.toHaveBeenCalled();
	});

	it.each(invalidInputs)("passes invalid input %# unchanged to the error factory", (input) => {
		// Arrange
		expect.hasAssertions();
		const error = new TypeError("Invalid member");
		const createError = vi.fn<(input: unknown) => Error>(() => error);

		// Act
		function parse(): Value {
			return parseEnum(values, input, createError);
		}

		// Assert
		expect(parse).toThrow(error);
		expect(createError).toHaveBeenCalledExactlyOnceWith(input);
	});
});
