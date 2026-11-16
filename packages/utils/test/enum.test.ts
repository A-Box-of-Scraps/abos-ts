// Numeric literals and exact booleans exercise member inference and freezing.
/* oxlint-disable no-magic-numbers, vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy */
import { assertNever, defineEnum, type EnumValue } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("enum definition", () => {
	it("freezes and returns the supplied object without adding properties", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Enabled: "enabled", Disabled: 0 } as const;

		// Act
		const status = defineEnum(members);

		// Assert
		expect(status).toBe(members);
		expect(Object.isFrozen(members)).toBe(true);
		expect(status).toStrictEqual({ Enabled: "enabled", Disabled: 0 });
		expect(Object.getOwnPropertySymbols(status)).toStrictEqual([]);
	});

	it("prevents changing, adding, and deleting members through either reference", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Enabled: "enabled", Disabled: 0 } as const;
		const status = defineEnum(members);

		// Act
		const changed = Reflect.set(members, "Enabled", "changed");
		const added = Reflect.set(status, "Pending", "pending");
		const deleted = Reflect.deleteProperty(status, "Disabled");

		// Assert
		expect(changed).toBe(false);
		expect(added).toBe(false);
		expect(deleted).toBe(false);
		expect(status).toStrictEqual({ Enabled: "enabled", Disabled: 0 });
	});

	it("infers readonly string and numeric literals without as const", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const status = defineEnum({ Enabled: "enabled", Disabled: 0 });

		// Assert
		expect(status.Enabled).toBe("enabled");
		expectTypeOf(status).toEqualTypeOf<{ readonly Enabled: "enabled"; readonly Disabled: 0 }>();
		expectTypeOf<EnumValue<typeof status>>().toEqualTypeOf<"enabled" | 0>();
	});

	it("preserves widened numbers alongside string literals", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Name: "name", Count: Number("1") } as const;

		// Act
		const values = defineEnum(members);

		// Assert
		expect(values).toBe(members);
		expectTypeOf(values).toEqualTypeOf<{ readonly Name: "name"; readonly Count: number }>();
		expectTypeOf<EnumValue<typeof values>>().toEqualTypeOf<"name" | number>();
	});

	it("rejects widened string members at compile time", () => {
		// Arrange
		expect.hasAssertions();
		const members = { Name: "name" };

		// Act
		function rejectMembers(text: string, mixed: string | number, union: { Name: string } | { Count: 0 }): void {
			// @ts-expect-error Mutable object properties infer widened strings.
			defineEnum(members);
			// @ts-expect-error Widened strings do not describe literal enum members.
			defineEnum({ Name: text });
			// @ts-expect-error A mixed member must not include widened strings.
			defineEnum({ Value: mixed });
			// @ts-expect-error Every branch must exclude widened string members.
			defineEnum(union);
			// @ts-expect-error Explicit type arguments must not bypass the restriction.
			defineEnum<{ Name: string }>({ Name: "name" });
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});

	it("supports empty definitions", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const values = defineEnum({});

		// Assert
		expect(values).toStrictEqual({});
		expect(Object.isFrozen(values)).toBe(true);
		expectTypeOf<EnumValue<typeof values>>().toBeNever();
	});
});

describe("literal enum compatibility", () => {
	it("accepts raw literals and matching values from other definitions", () => {
		// Arrange
		expect.hasAssertions();
		const status = defineEnum({ Enabled: "enabled", Disabled: 0 });
		const otherStatus = defineEnum({ Enabled: "enabled" });
		type Status = EnumValue<typeof status>;

		// Act
		const raw: Status = "enabled";
		const other: Status = otherStatus.Enabled;

		// Assert
		expect(raw).toBe(status.Enabled);
		expect(other).toBe(status.Enabled);
		expectTypeOf<"missing">().not.toExtend<Status>();
		expectTypeOf<1>().not.toExtend<Status>();
	});

	it("supports exhaustive switches using named members", () => {
		// Arrange
		expect.hasAssertions();
		const status = defineEnum({ Enabled: "enabled", Disabled: 0 });
		function label(value: EnumValue<typeof status>): string {
			switch (value) {
				case status.Enabled: {
					return "On";
				}
				case status.Disabled: {
					return "Off";
				}
				default: {
					return assertNever(value);
				}
			}
		}

		// Act
		const enabled = label(status.Enabled);
		const disabled = label(status.Disabled);

		// Assert
		expect(enabled).toBe("On");
		expect(disabled).toBe("Off");
	});

	it("supports exhaustive value-keyed mappings", () => {
		// Arrange
		expect.hasAssertions();
		const status = defineEnum({ Enabled: "enabled", Disabled: 0 });
		type Status = EnumValue<typeof status>;

		// Act
		const labels = { enabled: "On", 0: "Off" } satisfies Record<Status, string>;
		// @ts-expect-error An exhaustive mapping must include the disabled member.
		const incomplete = { enabled: "On" } satisfies Record<Status, string>;

		// Assert
		expect(labels[status.Enabled]).toBe("On");
		expect(labels[status.Disabled]).toBe("Off");
		expect(incomplete).not.toHaveProperty("0");
	});
});

describe("enum discriminants and input types", () => {
	it("narrows containing unions through named member comparisons", () => {
		// Arrange
		expect.hasAssertions();
		const status = defineEnum({ Enabled: "enabled", Disabled: 0 });
		type State =
			| { status: typeof status.Enabled; user: string }
			| { status: typeof status.Disabled; reason: string };
		function describeState(state: State): string {
			if (state.status === status.Enabled) {
				return state.user;
			}
			return state.reason;
		}

		// Act
		const enabled = describeState({ status: status.Enabled, user: "Alice" });
		const disabled = describeState({ status: status.Disabled, reason: "Paused" });

		// Assert
		expect(enabled).toBe("Alice");
		expect(disabled).toBe("Paused");
	});

	it("preserves union-valued members without branding or initializer validation", () => {
		// Arrange
		expect.hasAssertions();
		const members: { State: "enabled" | 0 } = { State: "enabled" };

		// Act
		const values = defineEnum(members);

		// Assert
		expect(values.State).toBe("enabled");
		expectTypeOf<EnumValue<typeof values>>().toEqualTypeOf<"enabled" | 0>();
	});

	it("rejects non-string and non-number members at compile time", () => {
		// Arrange
		expect.hasAssertions();
		const token = Symbol("token");

		// Act
		function rejectMembers(input: { Unknown: unknown; Optional?: string }): void {
			// @ts-expect-error Boolean members are not string or number values.
			defineEnum({ Enabled: true });
			// @ts-expect-error Bigint members are not string or number values.
			defineEnum({ Count: 1n });
			// @ts-expect-error Symbol members are not string or number values.
			defineEnum({ Token: token });
			// @ts-expect-error Object members are not string or number values.
			defineEnum({ Config: {} });
			// @ts-expect-error Array members are not string or number values.
			defineEnum({ Items: [] });
			// @ts-expect-error Undefined members are not string or number values.
			defineEnum({ Missing: undefined });
			// @ts-expect-error Null members are not string or number values.
			defineEnum({ Empty: null }); // oxlint-disable-line unicorn/no-null -- Exercise rejection of null members.
			// @ts-expect-error Unknown members cannot establish the value constraint.
			defineEnum({ Unknown: input.Unknown });
			// @ts-expect-error Optional member access can produce undefined.
			defineEnum({ Optional: input.Optional });
		}

		// Assert
		expect(rejectMembers).toBeTypeOf("function");
	});
});
