import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
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

// Reverse lookup accepts raw values and branded members without adding reverse properties.
assert.equal(reverseEnum(AccountStatus, "active"), "Active");
assert.equal(reverseEnum(AccountStatus, AccountStatus.Inactive), "Inactive");
assert.equal(reverseEnum(AccountStatus, "missing"), undefined);

// Enum objects are frozen; their values remain ordinary strings for serialization.
assert(Object.isFrozen(AccountStatus));
assert.equal(JSON.stringify({ status: parsed }), '{"status":"active"}');

// Members can be strings, numbers, or a mix of both.
// Unlike native declarations, this object API requires explicit values and adds no reverse mappings.
const settingBrand = Symbol("Setting");
const Setting = defineEnum(settingBrand, {
	Disabled: "disabled",
	RetryLimit: 3,
	Automatic: "automatic",
});
type Setting = EnumValue<typeof Setting>;

function parseSetting(value: unknown): Setting {
	return parseEnum(Setting, value, (invalid) => new TypeError(`Invalid setting: ${String(invalid)}`));
}

assert.equal(parseSetting("disabled"), Setting.Disabled);
// oxlint-disable-next-line no-magic-numbers -- Parse a raw numeric input rather than an already-branded member.
assert.equal(parseSetting(3), Setting.RetryLimit);
assert.equal(reverseEnum(Setting, Setting.RetryLimit), "RetryLimit");
assert.equal(parseSetting("automatic"), Setting.Automatic);
assert.equal(isEnum(Setting, "3"), false); // No coercion.
assert.equal(isEnum(Setting, false), false);
assert(Object.isFrozen(Setting));

// Other member types are rejected at compile time:
// Rejected: defineEnum(settingBrand, { Disabled: false });
// Rejected: defineEnum(settingBrand, { Defaults: { retries: 3 } });
// Rejected: defineEnum(settingBrand, { Missing: null });
// Rejected: defineEnum(settingBrand, { Missing: undefined });
// Rejected: defineEnum(settingBrand, { Name: "hello" as string });
// Rejected: defineEnum(settingBrand, { [Symbol("Key")]: 42 });
// Rejected: defineEnum(settingBrand, { "0": 42 });
// Rejected: defineEnum(settingBrand, { Name: "hello" as "hello" | "world" });
// Broad numbers are supported; broad strings, unknown, any, and nullable unions are not.
