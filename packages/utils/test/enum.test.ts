/* oxlint-disable no-magic-numbers, unicorn/no-null, vitest/prefer-to-be-falsy, vitest/prefer-to-be-truthy */
import { defineEnum, isEnum, parseEnum, reverseEnum } from "#src/index";
import { expect, test, vi } from "vitest";

test("adds members without changing earlier snapshots", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const empty = defineEnum(brand);

	// Act
	const ready = empty.add("Ready", "ready");
	const complete = ready.add("Done", 1);

	// Assert
	expect(Object.keys(empty)).toStrictEqual([]);
	expect(Object.keys(ready)).toStrictEqual(["Ready"]);
	expect(Object.keys(complete)).toStrictEqual(["Ready", "Done"]);
	expect(complete.Ready).toBe(ready.Ready);
});

test("exposes values and brands without enumerating the brand or builder", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");

	// Act
	const values = defineEnum(brand).add("Ready", "ready");

	// Assert
	expect(values.Ready.value).toBe("ready");
	expect(values.Ready.brand).toBe(brand);
	expect(Object.keys(values.Ready)).toStrictEqual(["value"]);
	expect(Object.keys(values)).toStrictEqual(["Ready"]);
});

test("freezes enums and their members", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const empty = defineEnum(brand);
	const values = empty.add("Ready", "ready");

	// Act
	const frozen = [empty, values, values.Ready].every(Object.isFrozen);

	// Assert
	expect(frozen).toBe(true);
	expect(Reflect.set(values, "Ready", {})).toBe(false);
	expect(Reflect.set(values.Ready, "value", "changed")).toBe(false);
	expect(Reflect.deleteProperty(values, "add")).toBe(false);
});

test("canonicalizes aliases across immutable branches", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const empty = defineEnum(brand);
	const left = empty.add("Ready", "ready");

	// Act
	const right = empty.add("Available", "ready");
	const aliases = left.add("Available", "ready");

	// Assert
	expect(right.Available).toBe(left.Ready);
	expect(aliases.Available).toBe(aliases.Ready);
	expect(isEnum(left, right.Available)).toBe(true);
	expect(reverseEnum(aliases, left.Ready)).toBe("Available");
});

test("keeps branch definitions independent even when names match", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const empty = defineEnum(brand);
	const left = empty.add("Ready", "ready");

	// Act
	const right = empty.add("Ready", "different");

	// Assert
	expect(right.Ready).not.toBe(left.Ready);
	expect(isEnum(left, right.Ready)).toBe(false);
	expect(reverseEnum(left, right.Ready)).toBeUndefined();
	expect(Object.keys(left)).toStrictEqual(["Ready"]);
});

test("distinguishes strings from numbers and canonicalizes signed zero", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("numbers");

	// Act
	const values = defineEnum(brand).add("Zero", 0).add("NegativeZero", -0).add("Text", "0");

	// Assert
	expect(values.Zero).toBe(values.NegativeZero);
	expect(values.Text).not.toBe(values.Zero);
	expect(parseEnum(values, -0)).toBe(values.Zero);
	expect(parseEnum(values, "0")).toBe(values.Text);
	expect(reverseEnum(values, values.Zero)).toBe("NegativeZero");
});

test("keeps equal values in distinct brands separate", () => {
	// Arrange
	expect.hasAssertions();
	const firstBrand = Symbol("status");
	const secondBrand = Symbol("status");

	// Act
	const first = defineEnum(firstBrand).add("Ready", "ready");
	const second = defineEnum(secondBrand).add("Ready", "ready");

	// Assert
	expect(first.Ready).not.toBe(second.Ready);
	expect(isEnum(first, second.Ready)).toBe(false);
	expect(() => parseEnum(first, second.Ready)).toThrow(TypeError);
	expect(reverseEnum(first, second.Ready)).toBeUndefined();
});

test("rejects reuse of a brand", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	defineEnum(brand);

	// Act
	function reuseBrand(): unknown {
		return defineEnum(brand);
	}

	// Assert
	expect(reuseBrand).toThrow(new TypeError("This enum brand has already been used"));
});

test.each([undefined, null, "brand", 1, true, {}, Symbol.for("enum-test")])(
	"rejects invalid brand %j",
	(brand) => {
		// Arrange
		expect.hasAssertions();

		// Act
		function create(): unknown {
			// @ts-expect-error Runtime callers may supply values other than unique symbols.
			return defineEnum(brand);
		}

		// Assert
		expect(create).toThrow(new TypeError("Enum brands must be non-registered symbols created with Symbol()"));
	},
);

test.each(["", "ready", "A1", "A_B", "A-B", "A B", " Ready", "Ready\n", "État", "Aé", "add", "__proto__", 1, null])(
	"rejects invalid member name %j",
	(name) => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("status");
		const values = defineEnum(brand);

		// Act
		function addInvalidName(): unknown {
			// @ts-expect-error Invalid names must also be rejected at runtime.
			return values.add(name, "ready");
		}

		// Assert
		expect(addInvalidName).toThrow(TypeError);
		expect(Object.keys(values)).toStrictEqual([]);
	},
);

test.each([undefined, null, true, {}, [], Symbol("value"), 1n, NaN, Infinity, -Infinity])(
	"rejects invalid member value %s",
	(value) => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("status");
		const values = defineEnum(brand);

		// Act
		function addInvalidValue(): unknown {
			// @ts-expect-error Runtime callers can bypass the literal value restriction.
			return values.add("Ready", value);
		}

		// Assert
		expect(addInvalidValue).toThrow(new TypeError("Enum values must be strings or finite numbers"));
		expect(values.add("Ready", "ready").Ready.value).toBe("ready");
	},
);

test("accepts single-letter names, mixed case, empty strings and finite numbers", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("values");

	// Act
	const values = defineEnum(brand).add("A", "").add("HTTP", -2).add("MixedCase", 1.5);

	// Assert
	expect(values.A.value).toBe("");
	expect(values.HTTP.value).toBe(-2);
	expect(values.MixedCase.value).toBe(1.5);
});

test("rejects duplicate names even when their values match", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");

	// Act
	function duplicateName(): unknown {
		// @ts-expect-error A member name cannot be added twice.
		return values.add("Ready", "ready");
	}

	// Assert
	expect(duplicateName).toThrow(new TypeError("Duplicate enum name: Ready"));
});

test("prevents constructing members through their exposed constructor", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");

	// Act
	function forgeMember(): unknown {
		return Reflect.construct(values.Ready.constructor, [Symbol("enum member constructor"), brand, "ready"]);
	}

	// Assert
	expect(forgeMember).toThrow(new TypeError("Enum members can only be created by defineEnum"));
});

test("parses existing members and primitive values to their canonical member", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const original = defineEnum(brand).add("Ready", "ready");
	const extended = original.add("Done", 1);

	// Act
	const parsedMember = parseEnum(extended, original.Ready);
	const parsedString = parseEnum(extended, "ready");
	const parsedNumber = parseEnum(extended, 1);

	// Assert
	expect(parsedMember).toBe(original.Ready);
	expect(parsedString).toBe(original.Ready);
	expect(parsedNumber).toBe(extended.Done);
});

test("recognizes and reverses only members present in a snapshot", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const original = defineEnum(brand).add("Ready", "ready");

	// Act
	const extended = original.add("Done", 1);

	// Assert
	expect(isEnum(extended, original.Ready)).toBe(true);
	expect(isEnum(original, extended.Done)).toBe(false);
	expect(reverseEnum(extended, original.Ready)).toBe("Ready");
	expect(reverseEnum(original, extended.Done)).toBeUndefined();
});

test("rejects members and values absent from a snapshot when parsing", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const original = defineEnum(brand).add("Ready", "ready");

	// Act
	const extended = original.add("Done", 1);

	// Assert
	expect(() => parseEnum(original, extended.Done)).toThrow(TypeError);
	expect(() => parseEnum(original, 1)).toThrow(TypeError);
});

test("matches nothing in an empty enum", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const empty = defineEnum(brand);

	// Act
	const values = empty.add("Ready", "ready");

	// Assert
	expect(isEnum(empty, values.Ready)).toBe(false);
	expect(reverseEnum(empty, values.Ready)).toBeUndefined();
	expect(() => parseEnum(empty, "ready")).toThrow(TypeError);
});

test.each([null, undefined, false, 1, "ready", "missing", NaN, Symbol("value"), () => "ready"])(
	"does not treat primitive or callable input %j as a member",
	(input) => {
		// Arrange
		expect.hasAssertions();
		const brand = Symbol("status");
		const values = defineEnum(brand).add("Ready", "ready");

		// Act
		const belongs = isEnum(values, input);
		const name = reverseEnum(values, input);

		// Assert
		expect(belongs).toBe(false);
		expect(name).toBeUndefined();
	},
);

test("rejects lookalikes, spreads, inherited members and proxies", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");
	const impostors: unknown[] = [
		{},
		{ value: "ready", brand },
		// oxlint-disable-next-line typescript/no-misused-spread
		{ ...values.Ready },
		Object.create(values.Ready),
		new Proxy(values.Ready, {}),
	];

	// Act
	const membership = impostors.map((input) => isEnum(values, input));
	const names = impostors.map((input) => reverseEnum(values, input));

	// Assert
	expect(membership).toStrictEqual(impostors.map(() => false));
	expect(names).toStrictEqual(impostors.map(() => undefined));
	for (const input of impostors) {
		expect(() => parseEnum(values, input)).toThrow(TypeError);
	}
});

test("does not coerce primitive input while parsing", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("numbers");
	const values = defineEnum(brand).add("One", 1);

	// Act
	function parseString(): unknown {
		return parseEnum(values, "1");
	}

	// Assert
	expect(parseString).toThrow(new TypeError("Invalid enum value: 1"));
});

test("calls a custom error factory only on failure with the unchanged input", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");
	const input = { value: "missing" };
	const error = new RangeError("Unknown status");
	const createError = vi.fn<(input: unknown) => Error>(() => error);

	// Act
	parseEnum(values, "ready", createError);

	// Assert
	expect(createError).not.toHaveBeenCalled();
	expect(() => parseEnum(values, input, createError)).toThrow(error);
	expect(createError).toHaveBeenCalledExactlyOnceWith(input);
});

test("requires original enum instances for all lookup helpers", () => {
	// Arrange
	expect.hasAssertions();
	const brand = Symbol("status");
	const values = defineEnum(brand).add("Ready", "ready");
	const impostors: unknown[] = [
		{ ...values },
		Object.create(values),
		new Proxy(values, {}),
	];

	// Act
	const lookups = [isEnum, parseEnum, reverseEnum];

	// Assert
	for (const lookup of lookups) {
		for (const impostor of impostors) {
			// @ts-expect-error Lookup helpers must reject unregistered objects supplied by runtime callers.
			expect(() => lookup(impostor, values.Ready)).toThrow(new TypeError("Expected an original enum instance"));
		}
	}
});
