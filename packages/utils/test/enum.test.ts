import { isEnumValue, parseEnumValue, type ValueOf } from "#src/index";
import assert from "node:assert/strict";
import { describe, expect, expectTypeOf, it } from "vitest";

const Status = Object.freeze({ Enabled: "enabled", Disabled: 0 } as const);
type Status = ValueOf<typeof Status>;

describe("enum values", () => {
	it.each([Status.Enabled, Status.Disabled])("narrows and parses the member %j", (member) => {
		// Arrange
		expect.hasAssertions();
		const input: unknown = member;

		// Act
		const accepted = isEnumValue(Status, input);
		const parsed = parseEnumValue(Status, input);

		// Assert
		assert.ok(accepted);
		expect(parsed).toBe(member);
		expectTypeOf<Status>().toEqualTypeOf<"enabled" | typeof Status.Disabled>();
		expectTypeOf(input).toEqualTypeOf<Status>();
		expectTypeOf(parsed).toEqualTypeOf<Status>();
	});

	it.each(["Enabled", "Disabled", "0", false, undefined, { value: "enabled" }])(
		"rejects the nonmember %j without coercion",
		(input) => {
			// Arrange
			expect.hasAssertions();

			// Act
			const accepted = isEnumValue(Status, input);
			function parse() {
				return parseEnumValue(Status, input);
			}

			// Assert
			assert.equal(accepted, false);
			expect(parse).toThrow(TypeError);
		},
	);
});
