import { Result } from "#src/index";
import { describe, expect, expectTypeOf, it } from "vitest";

describe("result helpers", () => {
	it("creates a success and preserves the value reference", () => {
		expect.hasAssertions();
		const value = { state: "ready" };
		const result = Result.ok(value);

		expect(result).toStrictEqual({ ok: true, value });
		expect(result.value).toBe(value);
		expectTypeOf(result.ok).toEqualTypeOf<true>();
		expectTypeOf(result.value).toEqualTypeOf<typeof value>();
		expectTypeOf(result).toExtend<Result<typeof value, Error>>();
	});

	it("creates a failure and preserves the error reference", () => {
		expect.hasAssertions();
		const error = new Error("Failed");
		const result = Result.err(error);

		expect(result).toStrictEqual({ ok: false, error });
		expect(result.error).toBe(error);
		expectTypeOf(result.ok).toEqualTypeOf<false>();
		expectTypeOf(result.error).toEqualTypeOf<Error>();
		expectTypeOf(result).toExtend<Result<string, Error>>();
	});

	it("supports non-Error failures and explicit type arguments", () => {
		expect.hasAssertions();
		const result = Result.err<"cancelled" | "timeout">("cancelled");

		expect(result.error).toBe("cancelled");
		expectTypeOf(result.error).toEqualTypeOf<"cancelled" | "timeout">();
		expectTypeOf(Result.ok<string>("ready").value).toEqualTypeOf<string>();
	});

	it.each(["", false, undefined])("preserves the payload %j in either variant", (payload) => {
		expect.hasAssertions();
		expect(Result.ok(payload)).toStrictEqual({ ok: true, value: payload });
		expect(Result.err(payload)).toStrictEqual({ ok: false, error: payload });
	});

	it.each<Result<string, Error>>([Result.ok("ready"), Result.err(new Error("Failed"))])(
		"narrows the union using ok for %j",
		(result) => {
			expect.hasAssertions();
			if (result.ok) {
				expectTypeOf(result.value).toEqualTypeOf<string>();
				expectTypeOf(result).not.toHaveProperty("error");
			} else {
				expectTypeOf(result.error).toEqualTypeOf<Error>();
				expectTypeOf(result).not.toHaveProperty("value");
			}
			expect(result).toHaveProperty("ok");
		},
	);
});
