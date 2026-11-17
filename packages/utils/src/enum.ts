type EnumPrimitive = string | number;
type EnumDefinition = Record<string, EnumPrimitive>;

// Distribute over union-shaped maps, excluding the private enum marker.
type EnumValue<Values extends EnumDefinition> = Values extends unknown ? Values[Extract<keyof Values, EnumPrimitive>]
	: never;

type EnumName<Values> = Values extends unknown ? `${Extract<keyof Values, EnumPrimitive>}` : never;

type IsUnion<Value, Whole = Value> = Value extends Whole ? [Whole] extends [Value] ? false : true : never;

// A single literal requires a concrete property; broad types and open template patterns do not.
type LiteralValue<Value extends EnumPrimitive> = true extends IsUnion<Value> ? never
	// oxlint-disable-next-line typescript/no-generated-empty-object-type
	: Record<never, never> extends Record<Value, never> ? never
	: Value;

type InvalidMemberName<Values extends EnumDefinition> = {
	[Name in keyof Values]-?: [LiteralValue<Values[Name]>] extends [never] ? Name : never;
}[keyof Values];

type LiteralDefinition<Values extends EnumDefinition> = true extends IsUnion<Values> ? never
	: string extends keyof Values ? never
	: number extends keyof Values ? never
	: Extract<keyof Values, symbol> extends never ? [InvalidMemberName<Values>] extends [never] ? unknown : never
	: never;

declare const enumDefinition: unique symbol;

// Invariance prevents a checked definition from being widened before a membership guard.
type DefinedEnum<Values extends EnumDefinition> = Readonly<Values> & {
	readonly [enumDefinition]: (values: Values) => Values;
};

function defineEnum<const Values extends EnumDefinition>(
	values: Values & LiteralDefinition<Values>,
): DefinedEnum<Values> {
	const prototype: unknown = Object.getPrototypeOf(values);
	if (prototype !== Object.prototype && prototype !== null) {
		throw new TypeError("Enum definitions must be plain objects");
	}

	// Accessors can change after freezing; hidden or inherited members evade Object.values.
	for (const key of Reflect.ownKeys(values)) {
		const descriptor = Object.getOwnPropertyDescriptor(values, key);
		if (
			typeof key !== "string"
			|| descriptor === undefined
			|| descriptor.enumerable !== true
			|| !("value" in descriptor)
			|| (typeof descriptor.value !== "string" && typeof descriptor.value !== "number")
		) {
			throw new TypeError("Enum members must be enumerable string-keyed data properties with string or number values");
		}
	}

	const frozen: Readonly<Values> = Object.freeze(values);
	// The marker records successful validation without adding a runtime enum member.
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return frozen as DefinedEnum<Values>;
}

function containsEnumValue(values: EnumDefinition, input: unknown): boolean {
	return (typeof input === "string" || typeof input === "number") && Object.values(values).includes(input);
}

function isEnum<const Values extends EnumDefinition>(
	values: DefinedEnum<Values>,
	input: unknown,
): input is EnumValue<Values> {
	return containsEnumValue(values, input);
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
	if (containsEnumValue(values, input)) {
		// Parsing only promises the successful value type, so broader maps remain supported.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		return input as EnumValue<Values>;
	}

	throw createError(input);
}

export { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum };
