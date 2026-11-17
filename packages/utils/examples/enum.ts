import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import assert from "node:assert/strict";

// The enum supplies branded runtime members; its matching type is their union.
const orderStatusBrand = Symbol("OrderStatus");
const OrderStatus = defineEnum(orderStatusBrand)
	.add("Pending", "pending")
	.add("Paid", "paid")
	.add("Shipped", "shipped");
type OrderStatus = EnumValue<typeof OrderStatus>;

function canShip(status: OrderStatus): boolean {
	return status === OrderStatus.Paid;
}

const readyToShip = canShip(OrderStatus.Paid);

assert.equal(readyToShip, true);
assert.equal(canShip(OrderStatus.Pending), false);
assert.equal(canShip(OrderStatus.Shipped), false);

// Parse untrusted API values into canonical members.
const apiStatus: unknown = "paid";
const invalidStatus: unknown = "delivered";
const paidStatus = parseEnum(OrderStatus, apiStatus);

assert.equal(paidStatus, OrderStatus.Paid);
assert.equal(canShip(paidStatus), true);
assert.throws(
	() => parseEnum(OrderStatus, invalidStatus, (input) => new Error(`Unknown order status: ${String(input)}`)),
	{ message: "Unknown order status: delivered" },
);

// A membership guard recognizes members, not their primitive values.
const candidate: unknown = paidStatus;
const acceptsMember = isEnum(OrderStatus, OrderStatus.Paid);
const acceptsPrimitive = isEnum(OrderStatus, "paid");

assert.equal(acceptsMember, true);
assert.equal(acceptsPrimitive, false);
if (isEnum(OrderStatus, candidate)) {
	// The guard narrows unknown to OrderStatus without a cast.
	assert.equal(canShip(candidate), true);
} else {
	assert.fail("The parsed status should be an OrderStatus member");
}
assert.equal(parseEnum(OrderStatus, OrderStatus.Paid), OrderStatus.Paid);

// Send primitive values over the wire; look up names from members.
const currentStatus = OrderStatus.Paid;
const payload = JSON.stringify({ status: currentStatus.value });
const memberName = reverseEnum(OrderStatus, currentStatus);

assert.equal(payload, '{"status":"paid"}');
assert.equal(memberName, "Paid");
assert.equal(reverseEnum(OrderStatus, "paid"), undefined);

// Equal primitive values do not make unrelated enums interchangeable.
const paymentStatusBrand = Symbol("PaymentStatus");
const PaymentStatus = defineEnum(paymentStatusBrand)
	.add("Pending", "pending")
	.add("Settled", "settled");
const acceptsPaymentStatus = isEnum(OrderStatus, PaymentStatus.Pending);

assert.equal(PaymentStatus.Pending.value, OrderStatus.Pending.value);
assert.notEqual(PaymentStatus.Pending, OrderStatus.Pending);
assert.equal(acceptsPaymentStatus, false);
assert.throws(() => parseEnum(OrderStatus, PaymentStatus.Pending), TypeError);

// These calls would fail typechecking:
// Rejected: canShip("paid");
// Rejected: canShip(PaymentStatus.Pending);

// Extending an enum creates a new snapshot, preserving existing members.
const originalNames = Object.keys(OrderStatus);
const CancellableOrderStatus = OrderStatus.add("Cancelled", "cancelled");

assert.deepEqual(Object.keys(OrderStatus), originalNames);
assert.equal(CancellableOrderStatus.Paid, OrderStatus.Paid);
assert.equal(isEnum(OrderStatus, CancellableOrderStatus.Cancelled), false);
assert.equal(isEnum(CancellableOrderStatus, CancellableOrderStatus.Cancelled), true);
assert.throws(() => parseEnum(OrderStatus, "cancelled"), TypeError);
assert.equal(parseEnum(CancellableOrderStatus, "cancelled"), CancellableOrderStatus.Cancelled);

// Aliases share a member; reverse lookup uses the last declared name.
const legacyStatus: unknown = "paid";
const AliasedOrderStatus = OrderStatus.add("PaymentReceived", "paid");

assert.equal(AliasedOrderStatus.PaymentReceived, OrderStatus.Paid);
assert.equal(parseEnum(AliasedOrderStatus, legacyStatus), AliasedOrderStatus.PaymentReceived);
assert.equal(reverseEnum(AliasedOrderStatus, AliasedOrderStatus.Paid), "PaymentReceived");
assert.equal(reverseEnum(OrderStatus, OrderStatus.Paid), "Paid");
