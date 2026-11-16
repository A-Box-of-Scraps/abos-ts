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
		expect.hasAssertions();
		expectTypeOf(assertNever).parameters.toEqualTypeOf<[value: never]>();
		expectTypeOf(assertNever).toEqualTypeOf<(value: never) => never>();
		expect(() => {
			// @ts-expect-error An unhandled union member cannot be passed as never.
			assertNever("unhandled");
		}).toThrow("Unexpected value: unhandled");
	});

	it("supports exhaustive union handling", () => {
		expect.hasAssertions();
		expect(describeState("idle")).toBe("Waiting");
		expect(describeState("running")).toBe("Working");
	});
});
