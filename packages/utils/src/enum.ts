declare const enumBrand: unique symbol;

type EnumMember<Value extends string, Brand extends symbol> = Value & {
	readonly [enumBrand]: Brand;
};

type EnumValue<Values> = Values[keyof Values];

function defineEnum<const Brand extends symbol, const Values extends Record<string, string>>(
	_brand: Brand,
	values: Values,
): { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> } {
	// Branding is type-only; the supplied strings remain unchanged at runtime.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return Object.freeze({ ...values }) as { readonly [Key in keyof Values]: EnumMember<Values[Key], Brand> };
}

function isEnum<const Values extends Record<string, string>>(
	values: Values,
	input: unknown,
): input is EnumValue<Values> {
	return typeof input === "string" && Object.values(values).includes(input);
}

function parseEnum<const Values extends Record<string, string>>(
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
