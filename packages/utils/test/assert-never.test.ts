import { assertNever } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

function describeState(state: "idle" | "running"): string {
	switch (state) {
		case "idle": {
			return "Waiting";
		}
		case "running": {
			return "Working";
		}
		default: {
			return assertNever(state);
		}
	}
}

describe("exhaustiveness assertion", () => {
	it("accepts only never and never returns", () => {
		// Arrange
		expect.hasAssertions();
		const input = "unhandled";

		// Act
		function assertUnhandled(): never {
			// @ts-expect-error An unhandled union member cannot be passed as never.
			return assertNever(input);
		}

		// Assert
		expectTypeOf(assertNever).parameters.toEqualTypeOf<[value: never]>();
		expectTypeOf(assertNever).toEqualTypeOf<(value: never) => never>();
		expect(assertUnhandled).toThrow("Unexpected value: unhandled");
	});

	it("supports exhaustive union handling", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const idleDescription = describeState("idle");
		const runningDescription = describeState("running");

		// Assert
		expect(idleDescription).toBe("Waiting");
		expect(runningDescription).toBe("Working");
	});
});
