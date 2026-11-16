import { Result } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("result helpers", () => {
	it("creates a success and preserves the value reference", () => {
		// Arrange
		expect.hasAssertions();
		const value = { state: "ready" };

		// Act
		const result = Result.ok(value);

		// Assert
		expect(result).toStrictEqual({ ok: true, value });
		expect(result.value).toBe(value);
		expectTypeOf(result.ok).toEqualTypeOf<true>();
		expectTypeOf(result.value).toEqualTypeOf<typeof value>();
		expectTypeOf(result).toExtend<Result<typeof value, Error>>();
	});

	it("creates a failure and preserves the error reference", () => {
		// Arrange
		expect.hasAssertions();
		const error = new Error("Failed");

		// Act
		const result = Result.err(error);

		// Assert
		expect(result).toStrictEqual({ ok: false, error });
		expect(result.error).toBe(error);
		expectTypeOf(result.ok).toEqualTypeOf<false>();
		expectTypeOf(result.error).toEqualTypeOf<Error>();
		expectTypeOf(result).toExtend<Result<string, Error>>();
	});

	it("supports non-Error failures and explicit type arguments", () => {
		// Arrange
		expect.hasAssertions();

		// Act
		const result = Result.err<"cancelled" | "timeout">("cancelled");
		const success = Result.ok<string>("ready");

		// Assert
		expect(result.error).toBe("cancelled");
		expectTypeOf(result.error).toEqualTypeOf<"cancelled" | "timeout">();
		expectTypeOf(success.value).toEqualTypeOf<string>();
	});

	it.each(["", false, undefined])("preserves the payload %j in either variant", (payload) => {
		// Arrange
		expect.hasAssertions();

		// Act
		const success = Result.ok(payload);
		const failure = Result.err(payload);

		// Assert
		expect(success).toStrictEqual({ ok: true, value: payload });
		expect(failure).toStrictEqual({ ok: false, error: payload });
	});

	it.each<Result<string, Error>>([Result.ok("ready"), Result.err(new Error("Failed"))])(
		"narrows the union using ok for %j",
		(result) => {
			// Arrange
			expect.hasAssertions();

			// Act
			if (result.ok) {
				// Assert
				expectTypeOf(result.value).toEqualTypeOf<string>();
				expectTypeOf(result).not.toHaveProperty("error");
			} else {
				// Assert
				expectTypeOf(result.error).toEqualTypeOf<Error>();
				expectTypeOf(result).not.toHaveProperty("value");
			}
			expect(result).toHaveProperty("ok");
		},
	);
});
