type ValueOf<ObjectType> = ObjectType[keyof ObjectType];

type EnumValues = Readonly<Record<string, string | number>>;

function isEnumValue<const Definition extends EnumValues>(
	values: Definition,
	input: unknown,
): input is ValueOf<Definition> {
	const members: readonly unknown[] = Object.values(values);
	return members.includes(input);
}

function parseEnumValue<const Definition extends EnumValues>(values: Definition, input: unknown): ValueOf<Definition> {
	if (!isEnumValue(values, input)) {
		throw new TypeError("Invalid enum value");
	}

	return input;
}

export { isEnumValue, parseEnumValue, type ValueOf };
