import { isEnumValue, parseEnumValue, type ValueOf } from "#src/index";
import assert from "node:assert/strict";

const Theme = Object.freeze({ System: "system", Light: "light", Dark: "dark" } as const);
type Theme = ValueOf<typeof Theme>;

// A saved preference may come from an older version of the app.
function restoreTheme(saved: unknown): Theme {
	if (isEnumValue(Theme, saved)) {
		return saved;
	}
	return Theme.System;
}

assert.equal(restoreTheme("dark"), Theme.Dark);
assert.equal(restoreTheme("midnight"), Theme.System);

// A new settings request should reject an unsupported theme rather than silently changing it.
assert.equal(parseEnumValue(Theme, "light"), Theme.Light);
assert.throws(() => parseEnumValue(Theme, "midnight"), TypeError);
