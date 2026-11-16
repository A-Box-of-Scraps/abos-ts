type EnumPrimitive = string | number;
type EnumDefinition = Record<string, EnumPrimitive>;

// Distribute over union-shaped maps to retain the values and names from every branch.
type EnumValue<Values extends EnumDefinition> = Values extends unknown ? Values[keyof Values] : never;

type EnumName<Values> = Values extends unknown ? `${Extract<keyof Values, EnumPrimitive>}` : never;

function defineEnum<const Values extends EnumDefinition>(values: Values): Readonly<Values> {
	return Object.freeze(values);
}

function isEnum<const Values extends EnumDefinition>(
	values: Values,
	input: unknown,
): input is EnumValue<Values> {
	return (typeof input === "string" || typeof input === "number") && Object.values(values).includes(input);
}

function reverseEnum<const Values extends EnumDefinition>(
	values: Values,
	input: unknown,
): EnumName<Values> | undefined {
	// Match includes semantics for NaN and signed zero; the last duplicate wins.
	const [key] = Object.entries(values).findLast(([, value]) => value === input || Object.is(value, input)) ?? [];

	// Object.entries returns own enumerable string keys, stringifying numeric keys.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return key as EnumName<Values> | undefined;
}

function parseEnum<const Values extends EnumDefinition>(
	values: Values,
	input: unknown,
	createError: (input: unknown) => Error = (value) => new TypeError(`Invalid enum value: ${String(value)}`),
): EnumValue<Values> {
	if (isEnum(values, input)) {
		return input;
	}

	throw createError(input);
}

export { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum };
