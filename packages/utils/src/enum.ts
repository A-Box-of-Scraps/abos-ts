type Primitive = string | number;
type Members = Readonly<Record<string, Primitive>>;
type IsUnion<Value, Whole = Value> = Value extends Whole ? [Whole] extends [Value] ? false : true : never;

// A single literal requires a concrete property; open template types and widened types do not.
type Literal<Value extends Primitive> = string extends Value ? never
	: number extends Value ? never
	: true extends IsUnion<Value> ? never
	: Record<never, never> extends Record<Value, unknown> ? never
	: Value;
type UniqueBrand<Brand extends symbol> = symbol extends Brand ? never
	: true extends IsUnion<Brand> ? never
	: Brand;

type UppercaseLetter =
	| "A"
	| "B"
	| "C"
	| "D"
	| "E"
	| "F"
	| "G"
	| "H"
	| "I"
	| "J"
	| "K"
	| "L"
	| "M"
	| "N"
	| "O"
	| "P"
	| "Q"
	| "R"
	| "S"
	| "T"
	| "U"
	| "V"
	| "W"
	| "X"
	| "Y"
	| "Z";
type Letter = UppercaseLetter | Lowercase<UppercaseLetter>;
type LettersOnly<Text extends string> = Text extends "" ? true
	: Text extends `${Letter}${infer Rest}` ? LettersOnly<Rest>
	: false;
type MemberName<Name extends string> = [Literal<Name>] extends [never] ? never
	: Name extends `${UppercaseLetter}${infer Rest}` ? LettersOnly<Rest> extends true ? Name : never
	: never;
type Append<Definition extends Members, Name extends string, Value extends Primitive> = {
	readonly [Key in keyof Definition | Name]: Key extends Name ? Value
		: Key extends keyof Definition ? Definition[Key]
		: never;
};

const memberToken = Symbol("enum member constructor");

// Private fields are not carried into the type of an object spread.
class Member<Brand extends symbol, Value extends Primitive> {
	readonly #brand: Brand;
	readonly value: Value;

	constructor(token: typeof memberToken, brand: Brand, value: Value) {
		if (token !== memberToken) {
			throw new TypeError("Enum members can only be created by defineEnum");
		}
		this.#brand = brand;
		this.value = value;
		Object.freeze(this);
	}

	// Keep Brand in emitted declarations without adding a spreadable data property.
	get brand(): Brand {
		return this.#brand;
	}

	static belongsTo(brand: symbol, input: unknown): input is Member<symbol, Primitive> {
		return typeof input === "object" && input !== null && #brand in input && input.#brand === brand;
	}
}

type EnumMember<Brand extends symbol, Value extends Primitive> = Value extends Primitive ? Member<Brand, Value> : never;

declare const definition: unique symbol;

type Enum<Brand extends symbol, Definition extends Members> =
	& {
		readonly [Name in keyof Definition]: EnumMember<Brand, Definition[Name]>;
	}
	& {
		// Brand and definition must both remain invariant when an enum is used as a guard.
		readonly [definition]: (brand: Brand, members: Definition) => readonly [Brand, Definition];
		readonly add: <const Name extends string, const Value extends Primitive>(
			name: Name & MemberName<Name> & (Name extends keyof Definition ? never : unknown),
			value: Value & Literal<Value>,
		) => Enum<Brand, Append<Definition, Name, Value>>;
	};

type EnumValue<EnumType> = EnumType extends {
	readonly [definition]: (brand: infer Brand extends symbol, members: infer Definition extends Members) => unknown;
} ? EnumMember<Brand, Definition[keyof Definition]>
	: never;

interface Domain {
	readonly brand: symbol;
	// Equal primitive values in one brand share an object, including across immutable branches.
	readonly canonicalMembers: Map<Primitive, Member<symbol, Primitive>>;
}

interface State {
	readonly domain: Domain;
	readonly members: ReadonlyMap<string, Member<symbol, Primitive>>;
}

// Non-registered symbols are weak keys, so brands and their members can be collected together.
const domains = new WeakMap<symbol, Domain>();
const states = new WeakMap<object, State>();

function getState(value: object): State {
	const state = states.get(value);
	if (state === undefined) {
		throw new TypeError("Expected an original enum instance");
	}
	return state;
}

function createEnum(domain: Domain, members: ReadonlyMap<string, Member<symbol, Primitive>>): object {
	const result: Record<string, unknown> = Object.fromEntries(members);

	function add(name: unknown, value: unknown): object {
		if (typeof name !== "string" || !/^[A-Z][A-Za-z]*$/.test(name)) {
			throw new TypeError("Enum names must start with an uppercase ASCII letter and contain only ASCII letters");
		}
		if (members.has(name)) {
			throw new TypeError(`Duplicate enum name: ${name}`);
		}
		if (typeof value !== "string" && (typeof value !== "number" || !Number.isFinite(value))) {
			throw new TypeError("Enum values must be strings or finite numbers");
		}

		let member = domain.canonicalMembers.get(value);
		if (member === undefined) {
			member = new Member(memberToken, domain.brand, value);
			domain.canonicalMembers.set(value, member);
		}
		return createEnum(domain, new Map([...members, [name, member]]));
	}

	Object.defineProperty(result, "add", { value: add });
	Object.freeze(result);
	states.set(result, { domain, members });
	return result;
}

function defineEnum<const Brand extends symbol>(brand: Brand & UniqueBrand<Brand>): Enum<Brand, Record<never, never>> {
	if (typeof brand !== "symbol" || Symbol.keyFor(brand) !== undefined) {
		throw new TypeError("Enum brands must be non-registered symbols created with Symbol()");
	}
	if (domains.has(brand)) {
		throw new TypeError("This enum brand has already been used");
	}
	const domain: Domain = { brand, canonicalMembers: new Map() };
	domains.set(brand, domain);
	return createEnum(domain, new Map()) as Enum<Brand, Record<never, never>>;
}

function isEnum<const Brand extends symbol, const Definition extends Members>(
	values: Enum<Brand, Definition>,
	input: unknown,
): input is EnumMember<Brand, Definition[keyof Definition]> {
	const state = getState(values);
	if (!Member.belongsTo(state.domain.brand, input)) {
		return false;
	}
	for (const member of state.members.values()) {
		if (member === input) {
			return true;
		}
	}
	return false;
}

function parseEnum<const Brand extends symbol, const Definition extends Members>(
	values: Enum<Brand, Definition>,
	input: unknown,
	createError: (input: unknown) => Error = (value) => new TypeError(`Invalid enum value: ${String(value)}`),
): EnumMember<Brand, Definition[keyof Definition]> {
	for (const member of getState(values).members.values()) {
		if (member === input || member.value === input) {
			// Registered snapshots contain exactly the members introduced by add.
			return member as EnumMember<Brand, Definition[keyof Definition]>;
		}
	}
	throw createError(input);
}

function reverseEnum<const Brand extends symbol, const Definition extends Members>(
	values: Enum<Brand, Definition>,
	input: unknown,
): Extract<keyof Definition, string> | undefined {
	let name: string | undefined;
	for (const [memberName, member] of getState(values).members) {
		if (member === input) {
			name = memberName;
		}
	}
	// Duplicate values are aliases of one canonical member; the last declared name wins.
	return name as Extract<keyof Definition, string> | undefined;
}

export { defineEnum, type Enum, type EnumMember, type EnumValue, isEnum, parseEnum, reverseEnum };
