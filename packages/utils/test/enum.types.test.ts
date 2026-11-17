/* oxlint-disable no-magic-numbers, unicorn/no-null, vitest/prefer-to-be-falsy */
import { defineEnum, type Enum, type EnumMember, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import { expect, expectTypeOf, test } from "vitest";

test("preserves literal values and the unique brand", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");

	// Act
	const values = defineEnum(brand).add("Ready", "ready").add("Done", 1);

	// Assert
	expectTypeOf(values.Ready.value).toEqualTypeOf<"ready">();
	expectTypeOf(values.Done.value).toEqualTypeOf<1>();
	expectTypeOf(values.Ready.brand).toEqualTypeOf<typeof brand>();
	expect(values.Ready.value).toBe("ready");
});

test("infers never for empty enums and non-enum types", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("empty");

	// Act
	const empty = defineEnum(brand);

	// Assert
	expectTypeOf<EnumValue<typeof empty>>().toBeNever();
	expectTypeOf<EnumValue<string>>().toBeNever();
	expectTypeOf(empty).not.toHaveProperty("Ready");
	expect(Object.keys(empty)).toStrictEqual([]);
});

test("infers a discriminated member union and identical alias types", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");

	// Act
	const values = defineEnum(brand).add("Ready", "ready").add("Done", 1).add("Available", "ready");

	// Assert
	expectTypeOf(values.Available).toEqualTypeOf<typeof values.Ready>();
	expectTypeOf<EnumValue<typeof values>>().toEqualTypeOf<typeof values.Ready | typeof values.Done>();
	expectTypeOf(values.Ready).toEqualTypeOf<EnumMember<typeof brand, "ready">>();
	expect(values.Available).toBe(values.Ready);
});

test("infers the parser member union and reverse lookup name union", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready").add("Done", 1).add("Available", "ready");

	// Act
	const parsed = parseEnum(values, "ready");
	const name = reverseEnum(values, values.Ready);

	// Assert
	expectTypeOf(parsed).toEqualTypeOf<EnumValue<typeof values>>();
	expectTypeOf(name).toEqualTypeOf<"Ready" | "Done" | "Available" | undefined>();
	expect(parsed).toBe(values.Ready);
});

test("narrows unknown input with the guard and discriminates members by value", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready").add("Done", 1);

	// Act
	const members = [values.Ready, values.Done, "ready"].filter((input: unknown) => isEnum(values, input));

	// Assert
	expectTypeOf(members).toEqualTypeOf<EnumValue<typeof values>[]>();
	expect(members).toStrictEqual([values.Ready, values.Done]);
	for (const member of members) {
		if (member.value === "ready") {
			expectTypeOf(member).toEqualTypeOf<typeof values.Ready>();
		} else {
			expectTypeOf(member).toEqualTypeOf<typeof values.Done>();
		}
	}
});

test("keeps brands nominal and prevents structural member forgery", () => {
	// Arrange
	expect.hasAssertions();
	const firstBrand = Symbol("status");
	const secondBrand = Symbol("status");
	const first = defineEnum(firstBrand).add("Ready", "ready");
	const second = defineEnum(secondBrand).add("Ready", "ready");

	// Act
	// oxlint-disable-next-line typescript/no-misused-spread
	const spread = { ...first.Ready };

	// Assert
	expectTypeOf(first.Ready).not.toExtend<typeof second.Ready>();
	expectTypeOf(spread).not.toExtend<typeof first.Ready>();
	expectTypeOf({ value: first.Ready.value, brand: firstBrand }).not.toExtend<typeof first.Ready>();
	expect(isEnum(first, spread)).toBe(false);
});

test("spreading a snapshot copies only its named members", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");

	// Act
	// oxlint-disable-next-line typescript/no-misused-spread
	const copy = { ...values };

	// Assert
	expectTypeOf(copy).toEqualTypeOf<{ Ready: typeof values.Ready }>();
	expectTypeOf<EnumValue<typeof copy>>().toBeNever();
	expectTypeOf({ ...copy, add: values.add }).not.toExtend<typeof values>();
	expect(copy.Ready).toBe(values.Ready);
	expect(copy).not.toHaveProperty("add");
	// @ts-expect-error A spread is not an enum snapshot.
	expect(() => isEnum(copy, values.Ready)).toThrow(TypeError);
});

test("keeps enum brands and definitions invariant", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const otherBrand = Symbol("status");
	const original = defineEnum(brand).add("Ready", "ready");

	// Act
	const extended = original.add("Done", 1);

	// Assert
	expectTypeOf(original).not.toExtend<typeof extended>();
	expectTypeOf(extended).not.toExtend<typeof original>();
	expectTypeOf(original).not.toExtend<Enum<typeof brand | typeof otherBrand, { readonly Ready: "ready" }>>();
	expectTypeOf(original).not.toExtend<Enum<typeof brand, { readonly Ready: "ready" | "done" }>>();
	expect(extended.Ready).toBe(original.Ready);
});

test("rejects widened or union brands at compile time", () => {
	// Arrange
	expect.hasAssertions();
	const firstBrand = Symbol("first");
	const secondBrand = Symbol("second");

	// Act
	function invalidBrands(widened: symbol, union: typeof firstBrand | typeof secondBrand): void {
		// @ts-expect-error A widened symbol does not identify one nominal domain.
		defineEnum(widened);
		// @ts-expect-error A union of brands does not identify one nominal domain.
		defineEnum(union);
		// @ts-expect-error Explicit type arguments cannot bypass the unique brand restriction.
		defineEnum<symbol>(firstBrand);
	}

	// Assert
	expect(invalidBrands).toBeTypeOf("function");
});

test("allows ASCII digits only after the initial letter", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("protocol");
	const values = defineEnum(brand);

	// Act
	const protocols = values.add("Http2", "h2");
	function invalidNames(): void {
		// @ts-expect-error Digits cannot start a name.
		values.add("1Ready", 0);
		// @ts-expect-error Only ASCII digits are allowed.
		values.add("Ready１", 0);
	}

	// Assert
	expectTypeOf(protocols.Http2.value).toEqualTypeOf<"h2">();
	expect(invalidNames).toBeTypeOf("function");
});

test("rejects invalid, widened, union and open-template member names at compile time", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");

	// Act
	function invalidNames(widened: string, union: "First" | "Second", template: `A${string}`): void {
		// @ts-expect-error Names must not be empty.
		values.add("", 0);
		// @ts-expect-error Names must start with an uppercase ASCII letter.
		values.add("ready", 0);
		// @ts-expect-error Punctuation is not allowed in names.
		values.add("Ready_State", 0);
		// @ts-expect-error Non-ASCII letters are not allowed in names.
		values.add("État", 0);
		// @ts-expect-error Non-ASCII letters are also forbidden after the first character.
		values.add("Aé", 0);
		// @ts-expect-error Member names cannot be repeated.
		values.add("Ready", 0);
		// @ts-expect-error Widened strings do not define a concrete name.
		values.add(widened, 0);
		// @ts-expect-error Union names would incorrectly introduce multiple properties.
		values.add(union, 0);
		// @ts-expect-error Open templates do not define a concrete name.
		values.add(template, 0);
	}

	// Assert
	expect(invalidNames).toBeTypeOf("function");
});

test("rejects widened, union, open-template and nonprimitive values at compile time", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand);

	// Act
	function invalidValues(input: {
		text: string;
		number: number;
		texts: "ready" | "done";
		numbers: 1 | 2;
		mixed: "ready" | 1;
		template: `status:${string}`;
		numericTemplate: `${number}`;
	}): void {
		// @ts-expect-error Widened strings are not literal values.
		values.add("Text", input.text);
		// @ts-expect-error Widened numbers are not literal values.
		values.add("Number", input.number);
		// @ts-expect-error String unions do not specify one value.
		values.add("Texts", input.texts);
		// @ts-expect-error Number unions do not specify one value.
		values.add("Numbers", input.numbers);
		// @ts-expect-error Mixed unions do not specify one value.
		values.add("Mixed", input.mixed);
		// @ts-expect-error Open string templates are not literal values.
		values.add("Template", input.template);
		// @ts-expect-error Open numeric templates are not literal values.
		values.add("NumericTemplate", input.numericTemplate);
		// @ts-expect-error Booleans are not supported enum values.
		values.add("Boolean", true);
		// @ts-expect-error Objects are not supported enum values.
		values.add("Object", {});
		// @ts-expect-error Null is not a supported enum value.
		values.add("Null", null);
	}

	// Assert
	expect(invalidValues).toBeTypeOf("function");
});

test("exposes enum properties and member data as readonly", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");

	// Act
	function mutate(replacement: typeof values): void {
		// @ts-expect-error Enum member properties are readonly.
		values.Ready = replacement.Ready;
		// @ts-expect-error Member values are readonly.
		values.Ready.value = "ready";
		// @ts-expect-error Member brands are readonly.
		values.Ready.brand = brand;
		// @ts-expect-error The builder method is readonly.
		values.add = replacement.add;
	}

	// Assert
	expect(mutate).toBeTypeOf("function");
});
