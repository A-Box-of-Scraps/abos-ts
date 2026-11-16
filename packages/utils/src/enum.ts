declare const enumBrand: unique symbol;

type EnumMember<Value extends string | number, Brand extends symbol> = Value & {
	readonly [enumBrand]: Brand;
};

// Native enums reject canonical numeric names ("1"), but allow other spellings ("01").
type EnumKey<Key> = string extends Key ? never
	: Key extends `${infer Numeric extends number}` ? `${Numeric}` extends Key ? never : Key
	: Key extends string ? Key
	: never;

// Distribute over numeric unions, but reject unions containing string members.
type EnumInitializer<Value, Whole = Value> = string extends Value ? never
	: Value extends number ? Value
	: Value extends string ? [Whole] extends [Value] ? Value : never
	: never;

type ValidEnumValues<Values> = unknown extends Values ? never : {
	[Key in keyof Values]-?: Key extends EnumKey<Key> ? EnumInitializer<Values[Key]> : never;
};

type EnumValue<Values extends Record<string, string | number>> = Values[keyof Values];

function defineEnum<const Brand extends symbol, const Values extends Record<string, string | number>>(
	_brand: Brand & (symbol extends Brand ? never : unknown),
	values: Values & ValidEnumValues<Values>,
): { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> } {
	// Branding is type-only; the supplied values remain unchanged at runtime.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return Object.freeze<Values>({ ...values }) as { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> };
}

function isEnum<const Values extends Record<string, string | number>>(
	values: Values,
	input: unknown,
): input is EnumValue<Values> {
	return (typeof input === "string" || typeof input === "number") && Object.values(values).includes(input);
}

function reverseEnum<const Values extends Record<string, string | number>>(
	values: Values,
	input: unknown,
): `${Extract<keyof Values, string | number>}` | undefined {
	// Match includes semantics for NaN and signed zero; the last duplicate wins.
	const [key] = Object.entries(values).findLast(([, value]) => value === input || Object.is(value, input)) ?? [];

	// Object.entries returns own enumerable string keys, stringifying numeric keys.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return key as `${Extract<keyof Values, string | number>}` | undefined;
}

function parseEnum<const Values extends Record<string, string | number>>(
	values: Values,
	input: unknown,
	createError: (input: unknown) => Error,
): EnumValue<Values> {
	if (isEnum(values, input)) {
		return input;
	}

	throw createError(input);
}

export { defineEnum, type EnumMember, type EnumValue, isEnum, parseEnum, reverseEnum };
