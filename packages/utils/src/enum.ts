declare const enumBrand: unique symbol;

type EnumMember<Value, Brand extends symbol> = Value & {
	readonly [enumBrand]: Brand;
};

// Reject broad and nullish member types before applying the type-only brand.
type ValidEnumValues<Values> = unknown extends Values ? never : {
	[Key in keyof Values]: unknown extends Values[Key] ? never
		: Extract<Values[Key], null | undefined> extends never ? Values[Key]
		: never;
};

type EnumValue<Values> = Values[keyof Values];

function defineEnum<const Brand extends symbol, const Values extends Record<string, unknown>>(
	_brand: Brand & (symbol extends Brand ? never : unknown),
	values: Values & ValidEnumValues<Values>,
): { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> } {
	// Branding is type-only; the supplied values remain unchanged at runtime.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return Object.freeze<Values>({ ...values }) as { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> };
}

function isEnum<const Values extends Record<string, unknown>>(
	values: Values,
	input: unknown,
): input is EnumValue<Values> {
	// Reference-valued members match by identity, not by structure.
	return Object.values(values).includes(input);
}

function parseEnum<const Values extends Record<string, unknown>>(
	values: Values,
	input: unknown,
	createError: (input: unknown) => Error,
): EnumValue<Values> {
	if (isEnum(values, input)) {
		return input;
	}

	throw createError(input);
}

export { defineEnum, type EnumMember, type EnumValue, isEnum, parseEnum };
