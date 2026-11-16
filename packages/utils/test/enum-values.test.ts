// Assert exact booleans rather than truthiness for the type guard.
/* oxlint-disable vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
// Numeric literals exercise literal inference and membership without coercion.
/* oxlint-disable no-magic-numbers */
import { defineEnum, type EnumMember, type EnumValue, isEnum, parseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

const valueBrand = Symbol("Values");
const token = Symbol("token");
const config = { retries: 3, timeout: 1000 };
const items = [1, 2, 3];
const date = new Date(0);

function callback(): string {
	return "result";
}

const values = defineEnum(valueBrand, {
	Pending: 0,
	Enabled: "enabled",
	Active: true,
	Inactive: false,
	Big: 1n,
	Token: token,
	NotANumber: Number.NaN,
	Infinity: Number.POSITIVE_INFINITY,
	Config: config,
	Values: items,
	Callback: callback,
	Date: date,
});
type Value = EnumValue<typeof values>;

const validInputs: unknown[] = [
	0,
	"enabled",
	true,
	false,
	1n,
	token,
	Number.NaN,
	Number.POSITIVE_INFINITY,
	config,
	items,
	callback,
	date,
];
const invalidInputs: unknown[] = [
	// oxlint-disable-next-line unicorn/no-null -- Null must not match an enum member.
	null,
	undefined,
	"Pending",
	"0",
	"true",
	1,
	0n,
	Symbol("token"),
	{ retries: 3, timeout: 1000 },
	[1, 2, 3],
	(): string => "result",
	new Date(0),
];

describe("mixed enum definition", () => {
	it("only freezes the container", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Config: { retries: 3 }, Values: [1, 2, 3], Callback: callback };

		// Act
		const result = defineEnum(valueBrand, members);

		// Assert
		expect(result).not.toBe(members);
		expect(Object.isFrozen(result)).toBe(true);
		expect(Object.isFrozen(result.Config)).toBe(false);
		expect(Object.isFrozen(result.Values)).toBe(false);
	});

	it("preserves reference-valued members and callable functions", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Config: config, Values: items, Callback: callback };

		// Act
		const result = defineEnum(valueBrand, members);
		const invoke = result.Callback;

		// Assert
		expect(result.Config).toBe(config);
		expect(result.Values).toBe(items);
		expect(invoke).toBe(callback);
		expect(invoke()).toBe("result");
		expectTypeOf(invoke).returns.toEqualTypeOf<string>();
	});

	it("infers branded literals, nested objects, and readonly tuples", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = defineEnum(valueBrand, {
			Pending: 0,
			Enabled: "enabled",
			Active: true,
			Big: 1n,
			Token: token,
			Config: { retries: 3, timeout: 1000 },
			Values: [1, 2, 3],
		});

		// Assert
		expect(result.Pending).toBe(0);
		expectTypeOf(result).toEqualTypeOf<{
			readonly Pending: EnumMember<0, typeof valueBrand>;
			readonly Enabled: EnumMember<"enabled", typeof valueBrand>;
			readonly Active: EnumMember<true, typeof valueBrand>;
			readonly Big: EnumMember<1n, typeof valueBrand>;
			readonly Token: EnumMember<typeof token, typeof valueBrand>;
			readonly Config: EnumMember<{ readonly retries: 3; readonly timeout: 1000 }, typeof valueBrand>;
			readonly Values: EnumMember<readonly [1, 2, 3], typeof valueBrand>;
		}>();
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
			// @ts-expect-error Null cannot carry a brand.
			defineEnum(brand, { Null: null }); // oxlint-disable-line unicorn/no-null -- Exercise rejection of null members.
			// @ts-expect-error Undefined cannot carry a brand.
			defineEnum(brand, { Undefined: undefined });
			// @ts-expect-error Nullable unions cannot carry a brand in every branch.
			defineEnum(brand, { Nullable: input.Nullable });
			// @ts-expect-error Unions with undefined cannot carry a brand in every branch.
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

describe("mixed enum branding", () => {
	it("keeps branded primitive members inhabitable", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type Member = EnumValue<typeof values>;

		// Assert
		expect(values.Pending).toBe(0);
		expectTypeOf<Extract<Member, number>>().not.toBeNever();
		expectTypeOf<Extract<Member, boolean>>().not.toBeNever();
		expectTypeOf<Extract<Member, bigint>>().not.toBeNever();
		expectTypeOf<Extract<Member, symbol>>().not.toBeNever();
	});

	it("rejects unbranded values and values from another enum", () => {
		// Arrange
		expect.hasAssertions();
		const otherBrand = Symbol("OtherValues");
		const members = {
			Number: 0,
			Boolean: true,
			Big: 1n,
			Token: token,
			Config: config,
			Values: items,
			Callback: callback,
		};

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

	it.each(invalidInputs)("rejects non-member %# without coercion or structural matching", (input) => {
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
