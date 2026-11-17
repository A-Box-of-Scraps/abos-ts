/* oxlint-disable no-magic-numbers, unicorn/no-null, vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

type AcceptsDefinition<Values extends Record<string, string | number>> = [Values] extends
	[Parameters<typeof defineEnum<Values>>[0]] ? true : false;

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
		expectTypeOf<Pick<typeof states, keyof typeof values>>().toEqualTypeOf<Readonly<typeof values>>();
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
		expectTypeOf<Pick<typeof states, "Ready" | "Pending">>().toEqualTypeOf<
			{ readonly Ready: "ready"; readonly Pending: 0 }
		>();
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
});

describe("enum definition constraints", () => {
	it("rejects widened and union member types", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type Numeric = AcceptsDefinition<{ Code: number }>;
		type Text = AcceptsDefinition<{ Ready: string }>;
		type Mixed = AcceptsDefinition<{ Code: string | number }>;
		type NumericUnion = AcceptsDefinition<{ Code: 1 | 2 }>;
		type StringUnion = AcceptsDefinition<{ Ready: "ready" | "pending" }>;
		type MixedUnion = AcceptsDefinition<{ Code: "ready" | 1 }>;

		// Assert
		expectTypeOf<[Numeric, Text, Mixed, NumericUnion, StringUnion, MixedUnion]>()
			.toEqualTypeOf<[false, false, false, false, false, false]>();
		expect(defineEnum).toBeTypeOf("function");
	});

	it("rejects definitions without a fixed set of literal members", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type Impossible = AcceptsDefinition<{ Code: never }>;
		type Pattern = AcceptsDefinition<{ Code: `code-${number}` }>;
		type Optional = AcceptsDefinition<{ Ready?: "ready" }>;
		type StringIndex = AcceptsDefinition<Record<string, "ready">>;
		type NumberIndex = AcceptsDefinition<Record<number, 1>>;
		type UnionKeys = AcceptsDefinition<{ Ready: "ready" } | { Pending: 0 }>;
		type UnionValues = AcceptsDefinition<{ Code: 1 } | { Code: 2 }>;

		// Assert
		expectTypeOf<[Impossible, Pattern, Optional, StringIndex, NumberIndex, UnionKeys, UnionValues]>()
			.toEqualTypeOf<[false, false, false, false, false, false, false]>();
		expect(defineEnum).toBeTypeOf("function");
	});

	it("rejects inferred widened numbers and union values at call sites", () => {
		// Arrange
		expect.hasAssertions();
		const widened: { Code: number } = { Code: 1 };
		const union: { Code: 1 | 2 } = { Code: 1 };

		// Act
		// @ts-expect-error Widened numbers cannot describe enum membership.
		const widenedResult = defineEnum(widened);
		// @ts-expect-error A union member promises values absent from the definition.
		const unionResult = defineEnum(union);
		// @ts-expect-error Bitwise expressions infer number rather than a single literal.
		const computedResult = defineEnum({ All: 1 | 2 | 4 });

		// Assert
		expect(widenedResult).toBe(widened);
		expect(unionResult).toBe(union);
		expect(computedResult.All).toBe(7);
	});

	it.each<{ values: { Ready: "ready" } | { Pending: 0 } }>([
		{ values: { Ready: "ready" } },
		{ values: { Pending: 0 } },
	])("rejects inferred union-shaped definitions at call sites: $values", ({ values }) => {
		// Arrange
		expect.hasAssertions();

		// Act
		// @ts-expect-error Only one union branch exists at runtime.
		const result = defineEnum(values);

		// Assert
		expect(result).toBe(values);
	});

	it("supports explicitly declared flag combinations", () => {
		// Arrange
		expect.hasAssertions();
		const levels = defineEnum({ Info: 1, Warning: 2, Error: 4, All: 7 });

		// Act
		const all = isEnum(levels, 7);
		const undeclaredCombination = isEnum(levels, 3);

		// Assert
		expect(all).toBe(true);
		expect(undeclaredCombination).toBe(false);
		expectTypeOf<EnumValue<typeof levels>>().toEqualTypeOf<1 | 2 | 4 | 7>();
	});

	it("keeps collections of string members separate from the enum", () => {
		// Arrange
		expect.hasAssertions();
		const levels = defineEnum({ Info: "info", Warning: "warn", Error: "error" });

		// Act
		const allLevels = [levels.Info, levels.Warning, levels.Error] as const;

		// Assert
		expect(allLevels).toStrictEqual(["info", "warn", "error"]);
		expect(isEnum(levels, allLevels)).toBe(false);
		expectTypeOf<EnumValue<typeof levels>>().toEqualTypeOf<"info" | "warn" | "error">();
	});
});

describe("enum membership", () => {
	it.each(["ready", "", 0, 1])("accepts member %s", (input) => {
		// Arrange
		expect.hasAssertions();
		const values = defineEnum({ Ready: "ready", Empty: "", Zero: 0, One: 1 });

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
});

describe("enum type guards", () => {
	it("narrows unknown input to the enum value union", () => {
		// Arrange
		expect.hasAssertions();
		const states = defineEnum({ Ready: "ready", Pending: 0 });

		// Act
		function check(input: unknown): boolean {
			if (isEnum(states, input)) {
				expectTypeOf(input).toEqualTypeOf<"ready" | 0>();
				return true;
			}
			expectTypeOf(input).toBeUnknown();
			return false;
		}

		// Assert
		expect(check("ready")).toBe(true);
		expect(check(0)).toBe(true);
		expect(check(2)).toBe(false);
	});

	it("excludes only declared members in the false branch", () => {
		// Arrange
		expect.hasAssertions();
		const codes = defineEnum({ One: 1 });

		// Act
		function check(input: 1 | 2 | "other"): boolean {
			if (isEnum(codes, input)) {
				expectTypeOf(input).toEqualTypeOf<1>();
				return true;
			}
			expectTypeOf(input).toEqualTypeOf<2 | "other">();
			return false;
		}

		// Assert
		expect(check(1)).toBe(true);
		expect(check(2)).toBe(false);
		expect(check("other")).toBe(false);
	});

	it("does not exclude all numbers when a numeric member is rejected", () => {
		// Arrange
		expect.hasAssertions();
		const codes = defineEnum({ One: 1 });

		// Act
		function check(input: number | string): boolean {
			if (isEnum(codes, input)) {
				expectTypeOf(input).toEqualTypeOf<1>();
				return true;
			}
			expectTypeOf(input).toEqualTypeOf<number | string>();
			return false;
		}

		// Assert
		expect(check(1)).toBe(true);
		expect(check(2)).toBe(false);
		expect(check("other")).toBe(false);
	});

	it("narrows filtered arrays", () => {
		// Arrange
		expect.hasAssertions();
		const states = defineEnum({ Ready: "ready", Pending: 0 });
		const inputs: unknown[] = ["ready", 0, "other", 1];

		// Act
		const members = inputs.filter((input) => isEnum(states, input));

		// Assert
		expect(members).toStrictEqual(["ready", 0]);
		expectTypeOf(members).toEqualTypeOf<("ready" | 0)[]>();
	});
});

describe("enum guard constraints", () => {
	it("requires a definition checked by defineEnum", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		type GuardInput = Parameters<typeof isEnum<{ Ready: "ready" }>>[0];
		type PlainDefinitionAccepted = { readonly Ready: "ready" } extends GuardInput ? true : false;

		// Assert
		expectTypeOf<PlainDefinitionAccepted>().toEqualTypeOf<false>();
		expect(isEnum).toBeTypeOf("function");
	});

	it("prevents widening or combining checked definitions", () => {
		// Arrange
		expect.hasAssertions();
		const first = defineEnum({ Code: 1 });
		const second = defineEnum({ Code: 2 });

		// Act
		type WidenedInput = Parameters<typeof isEnum<{ Code: number }>>[0];
		type UnionInput = Parameters<typeof isEnum<{ Code: 1 } | { Code: 2 }>>[0];
		type WidenedAccepted = typeof first extends WidenedInput ? true : false;
		type UnionAccepted = typeof first | typeof second extends UnionInput ? true : false;

		// Assert
		expectTypeOf<[WidenedAccepted, UnionAccepted]>().toEqualTypeOf<[false, false]>();
		expect(first.Code).toBe(1);
		expect(second.Code).toBe(2);
	});

	it.each([true, false])("rejects union-shaped checked enums at call sites: %s", (useFirst) => {
		// Arrange
		expect.hasAssertions();
		const first = defineEnum({ Ready: "ready" });
		const second = defineEnum({ Pending: 0 });
		let states: typeof first | typeof second = first;
		if (!useFirst) {
			states = second;
		}

		// Act
		// @ts-expect-error Combining definitions must not widen the guard's asserted type.
		const result = isEnum(states, "ready");

		// Assert
		expect(result).toBe(useFirst);
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
		const values = { Ready: "ready", Empty: "", Zero: 0, One: 1, NaN: Number.NaN, Infinity };
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
	it.each(
		[
			{ first: 0, last: -0, input: 0 },
			{ first: -0, last: 0, input: -0 },
		] as const,
	)("uses matching membership and reverse lookup semantics for $input", ({ first, last, input }) => {
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
});

describe("enum runtime definition validation", () => {
	it("rejects inherited definitions", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Own: "own" } as const;
		Object.setPrototypeOf(values, { Inherited: "inherited" });

		// Act
		function define(): void {
			defineEnum(values);
		}

		// Assert
		expect(define).toThrow(TypeError);
	});

	it("rejects non-enumerable members", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Hidden: "hidden" } as const;
		Object.defineProperty(values, "Hidden", { enumerable: false });

		// Act
		function define(): void {
			defineEnum(values);
		}

		// Assert
		expect(define).toThrow(TypeError);
	});

	it("rejects accessors without invoking them", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Ready: "ready" } as const;
		const getter = vi.fn<() => string>(() => "ready");
		Object.defineProperty(values, "Ready", { get: getter });

		// Act
		function define(): void {
			defineEnum(values);
		}

		// Assert
		expect(define).toThrow(TypeError);
		expect(getter).not.toHaveBeenCalled();
	});

	it("rejects symbol keys at compile time and runtime", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Own: "own", [Symbol("Hidden")]: "symbol" } as const;

		// Act
		type DefinitionInput = Parameters<typeof defineEnum<typeof values>>[0];
		function define(): void {
			// @ts-expect-error Symbol keys are not enum members.
			defineEnum(values);
		}

		// Assert
		expectTypeOf<DefinitionInput>().toBeNever();
		expect(define).toThrow(TypeError);
	});

	it.each([true, null, undefined, 1n, Symbol("ready"), {}, ["ready"]])(
		"rejects non-primitive member values at runtime: %s",
		(value) => {
			// Arrange
			expect.hasAssertions();
			const values = { Ready: "ready" } as const;
			Object.defineProperty(values, "Ready", { value });

			// Act
			function define(): void {
				defineEnum(values);
			}

			// Assert
			expect(define).toThrow(TypeError);
		},
	);

	it("supports plain definitions without a prototype", () => {
		// Arrange
		expect.hasAssertions();
		const values = { Ready: "ready" } as const;
		Object.setPrototypeOf(values, null);

		// Act
		const states = defineEnum(values);

		// Assert
		expect(isEnum(states, "ready")).toBe(true);
		expect(Object.isFrozen(states)).toBe(true);
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
		const members = values;

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
