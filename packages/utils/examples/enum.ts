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
