/* oxlint-disable no-magic-numbers, unicorn/no-null, vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

describe("enum definitions", () => {
	it("preserves literal members and the original object reference", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Ready: "ready" as const, Pending: 0 as const, Empty: "" as const };

		// Act
		const states = defineEnum(values);

		// Assert
		expect(states).toBe(values);
		expect(states).toStrictEqual({ Ready: "ready", Pending: 0, Empty: "" });
		expect(Object.isFrozen(states)).toBe(true);
		expectTypeOf(states).toEqualTypeOf<Readonly<typeof values>>();
		expectTypeOf<EnumValue<typeof states>>().toEqualTypeOf<"ready" | 0 | "">();
	});

	it("prevents changing, adding, or deleting members", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready" });

		// Act
		const changed = Reflect.set(values, "Ready", "changed");
		const added = Reflect.set(values, "Added", "added");
		const deleted = Reflect.deleteProperty(values, "Ready");

		// Assert
		expect(changed).toBe(false);
		expect(added).toBe(false);
		expect(deleted).toBe(false);
		expect(values).toStrictEqual({ Ready: "ready" });
	});

	it("infers readonly literal members without a const assertion", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const states = defineEnum({ Ready: "ready", Pending: 0 });

		// Assert
		expect(states.Ready).toBe("ready");
		expectTypeOf(states).toEqualTypeOf<{ readonly Ready: "ready"; readonly Pending: 0 }>();
	});

	it("supports empty definitions", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const empty = defineEnum({});

		// Assert
		expect(empty).toStrictEqual({});
		expect(Object.isFrozen(empty)).toBe(true);
		expectTypeOf<EnumValue<typeof empty>>().toBeNever();
	});

	it("rejects widened strings, including strings in one union branch", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type WidenedInput = Parameters<typeof defineEnum<{ Ready: string }>>[0];
		type MixedInput = Parameters<typeof defineEnum<{ Ready: "ready"; Code: string | number }>>[0];
		type UnionInput = Parameters<typeof defineEnum<{ Ready: "ready" } | { Other: string }>>[0];

		// Assert
		expectTypeOf<WidenedInput>().toBeNever();
		expectTypeOf<MixedInput>().toBeNever();
		expectTypeOf<UnionInput>().toBeNever();
		expect(defineEnum).toBeTypeOf("function");
	});
});

describe("enum membership", () => {
	it.each(["ready", "", 0, 1, Number.NaN, Number.POSITIVE_INFINITY])("accepts member %s", (input) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready", Empty: "", Zero: 0, One: 1, NaN: Number.NaN, Infinity });

		// Act
		const result = isEnum(values, input);

		// Assert
		expect(result).toBe(true);
		expectTypeOf(result).toEqualTypeOf<boolean>();
	});

	it.each(["Ready", "missing", "1", 2, true, false, null, undefined, 1n, Symbol("ready"), {}, ["ready"]])(
		"rejects non-member %s without coercion",
		(input) => {
			// Arrange
			expect.hasAssertions();
			const values = defineEnum({ Ready: "ready", One: 1 });

			// Act
			const result = isEnum(values, input);

			// Assert
			expect(result).toBe(false);
		},
	);

	it("does not narrow unknown input to a widened numeric member type", () => {
		// Arrange
		expect.hasAssertions();
		const values: { Code: number } = { Code: 1 };
		const codes = defineEnum(values);

		// Act
		function check(input: unknown): boolean {
			if (isEnum(codes, input)) {
				expectTypeOf(input).toBeUnknown();
				return true;
			}
			expectTypeOf(input).toBeUnknown();
			return false;
		}

		// Assert
		expect(check(1)).toBe(true);
		expect(check(2)).toBe(false);
		expectTypeOf<EnumValue<typeof codes>>().toEqualTypeOf<number>();
	});
});

describe("enum reverse lookup", () => {
	it.each([
		{ input: "ready", expected: "Ready" },
		{ input: 1, expected: "One" },
		{ input: "", expected: "Empty" },
		{ input: "1", expected: undefined },
		{ input: "Ready", expected: undefined },
		{ input: null, expected: undefined },
	])("maps $input to $expected", ({ input, expected }) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready", One: 1, Empty: "" });

		// Act
		const name = reverseEnum(values, input);

		// Assert
		expect(name).toBe(expected);
		expectTypeOf(name).toEqualTypeOf<"Ready" | "One" | "Empty" | undefined>();
	});

	it("returns the last name for duplicate values", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ First: "ready", Last: "ready" });

		// Act
		const name = reverseEnum(values, "ready");

		// Assert
		expect(name).toBe("Last");
	});

	it("stringifies numeric keys and follows object enumeration order", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ 10: "ready", 2: "ready", "": "empty-name" });

		// Act
		const numericName = reverseEnum(values, "ready");
		const emptyName = reverseEnum(values, "empty-name");

		// Assert
		expect(numericName).toBe("10");
		expect(emptyName).toBe("");
		expectTypeOf(numericName).toEqualTypeOf<"10" | "2" | "" | undefined>();
	});
});

describe("enum parsing", () => {
	it.each(["ready", "", 0, 1, Number.NaN, Number.POSITIVE_INFINITY])("preserves member %s", (input) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready", Empty: "", Zero: 0, One: 1, NaN: Number.NaN, Infinity });
		const createError = vi.fn<(input: unknown) => Error>(() => new Error("Invalid"));

		// Act
		const parsed = parseEnum(values, input, createError);

		// Assert
		expect(parsed).toBe(input);
		expect(createError).not.toHaveBeenCalled();
	});

	it.each([
		{ input: "Ready", message: "Ready" },
		{ input: "missing", message: "missing" },
		{ input: "1", message: "1" },
		{ input: 2, message: "2" },
		{ input: true, message: "true" },
		{ input: false, message: "false" },
		{ input: null, message: "null" },
		{ input: undefined, message: "undefined" },
		{ input: 1n, message: "1" },
		{ input: Symbol("ready"), message: "Symbol(ready)" },
		{ input: {}, message: "[object Object]" },
		{ input: ["ready"], message: "ready" },
	])(
		"throws a descriptive TypeError for $message",
		({ input, message }) => {
			// Arrange
			expect.hasAssertions();
			const values = defineEnum({ Ready: "ready", One: 1 });

			// Act
			function parseInvalid(): string | number {
				return parseEnum(values, input);
			}

			// Assert
			expect(parseInvalid).toThrow(TypeError);
			expect(parseInvalid).toThrow(`Invalid enum value: ${message}`);
		},
	);

	it("throws the custom error and passes the original input exactly once", () => {
		// Arrange
		expect.hasAssertions();
		const input = { state: "missing" };
		const error = new RangeError("Unknown state");
		const createError = vi.fn<(input: unknown) => Error>((value) => {
			expect(value).toBe(input);
			return error;
		});

		// Act
		let thrown: unknown = undefined;
		try {
			parseEnum({ Ready: "ready" }, input, createError);
		} catch (error_: unknown) {
			thrown = error_;
		}

		// Assert
		expect(thrown).toBe(error);
		expect(createError).toHaveBeenCalledExactlyOnceWith(input);
	});

	it("returns the complete literal value union", () => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready", Pending: 0 });

		// Act
		const parsed = parseEnum(values, "ready");

		// Assert
		expect(parsed).toBe("ready");
		expectTypeOf(parsed).toEqualTypeOf<"ready" | 0>();
	});
});

describe("enum lookup edge cases", () => {
	it.each([
		{ first: Number.NaN, last: Number.NaN, input: Number.NaN },
		{ first: 0, last: -0, input: 0 },
		{ first: -0, last: 0, input: -0 },
	])("uses matching membership and reverse lookup semantics for $input", ({ first, last, input }) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ First: first, Last: last });

		// Act
		const member = isEnum(values, input);
		const parsed = parseEnum(values, input);
		const name = reverseEnum(values, input);

		// Assert
		expect(member).toBe(true);
		expect(parsed).toBe(input);
		expect(name).toBe("Last");
	});

	it.each(["missing", 0, null, undefined])("finds no members in an empty definition for %j", (input) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({});

		// Act
		const member = isEnum(values, input);
		const name = reverseEnum(values, input);

		// Assert
		expect(member).toBe(false);
		expect(name).toBeUndefined();
		expect(() => parseEnum(values, input)).toThrow(TypeError);
		expectTypeOf(name).toEqualTypeOf<undefined>();
		expectTypeOf(parseEnum<typeof values>).returns.toBeNever();
	});

	it.each(["inherited", "hidden", "symbol"])("ignores %s properties", (input) => {
		// Arrange
		expect.hasAssertions();
		const values = { Own: "own", [Symbol("Hidden")]: "symbol" } as const;
		Object.setPrototypeOf(values, { Inherited: "inherited" });
		Object.defineProperty(values, "Hidden", { value: "hidden", enumerable: false });
		const members = defineEnum(values);

		// Act
		const result = {
			member: isEnum(members, input),
			name: reverseEnum(members, input),
			parse: () => parseEnum(members, input),
		};

		// Assert
		expect(result).toMatchObject({ member: false, name: undefined });
		expect(result.parse).toThrow(TypeError);
		expect(isEnum(members, "own")).toBe(true);
		expect(reverseEnum(members, "own")).toBe("Own");
	});
});

describe("enum member types", () => {
	it("rejects non-string and non-number definitions at compile time", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		// @ts-expect-error Boolean values are not enum members.
		type BooleanDefinition = typeof defineEnum<{ Invalid: boolean }>;
		// @ts-expect-error Null values are not enum members.
		type NullDefinition = typeof defineEnum<{ Invalid: null }>;
		// @ts-expect-error Symbol values are not enum members.
		type SymbolDefinition = typeof defineEnum<{ Invalid: symbol }>;
		// @ts-expect-error Object values are not enum members.
		type ObjectDefinition = typeof defineEnum<{ Invalid: { nested: "ready" } }>;

		// Assert
		expectTypeOf<BooleanDefinition>().toBeFunction();
		expectTypeOf<NullDefinition>().toBeFunction();
		expectTypeOf<SymbolDefinition>().toBeFunction();
		expectTypeOf<ObjectDefinition>().toBeFunction();
		expect(defineEnum).toBeTypeOf("function");
	});

	it.each<{ values: { Ready: "ready" } | { Pending: 0 }; input: "ready" | 0; name: string }>([
		{ values: { Ready: "ready" }, input: "ready", name: "Ready" },
		{ values: { Pending: 0 }, input: 0, name: "Pending" },
	])("retains members from every union branch for $name", ({ values, input, name }) => {
		// Arrange
		expect.hasAssertions();
		const members = defineEnum(values);

		// Act
		const parsed = parseEnum(members, input);
		const reversed = reverseEnum(members, input);

		// Assert
		expect(parsed).toBe(input);
		expect(reversed).toBe(name);
		expectTypeOf<EnumValue<typeof members>>().toEqualTypeOf<"ready" | 0>();
		expectTypeOf(parsed).toEqualTypeOf<"ready" | 0>();
		expectTypeOf(reversed).toEqualTypeOf<"Ready" | "Pending" | undefined>();
	});
});
