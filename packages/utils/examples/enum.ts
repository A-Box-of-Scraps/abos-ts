import { defineEnum, type EnumValue, isEnum, parseEnum } from "#src/index";
import assert from "node:assert/strict";

// Keep each brand in its own const so TypeScript preserves its unique symbol type.
const accountStatusBrand = Symbol("AccountStatus");
const AccountStatus = defineEnum(accountStatusBrand, {
	Active: "active",
	Inactive: "inactive",
});
type AccountStatus = EnumValue<typeof AccountStatus>;

const subscriptionStatusBrand = Symbol("SubscriptionStatus");
const SubscriptionStatus = defineEnum(subscriptionStatusBrand, {
	Active: "active",
	Expired: "expired",
});

function isActiveAccount(status: AccountStatus): boolean {
	return status === AccountStatus.Active;
}

assert(isActiveAccount(AccountStatus.Active));

// Both members are "active" at runtime, but their brands are different.
assert.equal(AccountStatus.Active, SubscriptionStatus.Active);
// These calls would fail typechecking:
// Rejected: isActiveAccount(SubscriptionStatus.Active);
// Rejected: isActiveAccount("active");

// Validate external input to narrow unknown to the branded union.
const input: unknown = "active";
if (isEnum(AccountStatus, input)) {
	assert(isActiveAccount(input));
}
assert.equal(isEnum(AccountStatus, "Active"), false); // Values, not property names.

// Parse when invalid input should throw an application-specific error.
function createStatusError(value: unknown): Error {
	return new TypeError(`Invalid account status: ${String(value)}`);
}

const parsed = parseEnum(AccountStatus, input, createStatusError);
assert(isActiveAccount(parsed));
assert.throws(() => parseEnum(AccountStatus, "expired", createStatusError), {
	name: "TypeError",
	message: "Invalid account status: expired",
});

// Enum objects are frozen; their values remain ordinary strings for serialization.
assert(Object.isFrozen(AccountStatus));
assert.equal(JSON.stringify({ status: parsed }), '{"status":"active"}');

// Members can also be numbers, booleans, bigints, symbols, or reference values.
const settingBrand = Symbol("Setting");
const automatic = Symbol("automatic");
const defaults = { retries: 3 };
const Setting = defineEnum(settingBrand, {
	Disabled: false,
	RetryLimit: 3,
	LargeLimit: 1n,
	Automatic: automatic,
	Defaults: defaults,
});
type Setting = EnumValue<typeof Setting>;

function parseSetting(value: unknown): Setting {
	return parseEnum(Setting, value, (invalid) => new TypeError(`Invalid setting: ${String(invalid)}`));
}

assert.equal(parseSetting(false), Setting.Disabled);
// oxlint-disable-next-line no-magic-numbers -- Parse a raw numeric input rather than an already-branded member.
assert.equal(parseSetting(3), Setting.RetryLimit);
// oxlint-disable-next-line no-magic-numbers -- Parse a raw bigint input rather than an already-branded member.
assert.equal(parseSetting(1n), Setting.LargeLimit);
assert.equal(parseSetting(automatic), Setting.Automatic);
assert.equal(isEnum(Setting, "3"), false); // No coercion.

// Reference values match by identity, and only the enum container is frozen.
assert.equal(parseSetting(defaults), Setting.Defaults);
assert.equal(isEnum(Setting, { retries: 3 }), false);
assert(Object.isFrozen(Setting));
assert.equal(Object.isFrozen(defaults), false);

// Nullish and broad member types are rejected at compile time:
// Rejected: defineEnum(settingBrand, { Missing: null });
// Rejected: defineEnum(settingBrand, { Missing: undefined });
// Members typed as unknown, any, or nullable unions are also rejected.
