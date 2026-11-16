import { defineEnum, type EnumValue, isEnum, parseEnum, reverseEnum } from "#src/index";
import assert from "node:assert/strict";

// One definition supplies frozen runtime members and their literal value union.
const Priority = defineEnum({
	Low: 1,
	Normal: 2,
	High: 3,
});
type Priority = EnumValue<typeof Priority>;

const queuedJobs: { name: string; priority: Priority }[] = [];

function enqueueJob(name: string, priority: Priority): void {
	queuedJobs.push({ name, priority });
}

// An API field remains unknown until it has been validated.
const request: { name: string; priority: unknown } = {
	name: "generate-report",
	priority: 3,
};

assert.equal(Object.isFrozen(Priority), true);

// The isEnum helper answers a membership question; it does not narrow request.priority.
const supported = isEnum(Priority, request.priority);
assert.equal(supported, true);

// The parseEnum helper returns a Priority, so the queue never needs to accept unknown input.
const priority = parseEnum(Priority, request.priority);
enqueueJob(request.name, priority);
assert.deepEqual(queuedJobs, [{ name: request.name, priority: Priority.High }]);

// Reverse lookup turns a wire value into its member name for logs or display.
const priorityName = reverseEnum(Priority, priority);
assert.equal(priorityName, "High");

// Validation does not coerce: the string "3" is not the numeric member 3.
const invalidPriority: unknown = "3";
assert.equal(isEnum(Priority, invalidPriority), false);
assert.equal(reverseEnum(Priority, invalidPriority), undefined);
assert.throws(() => parseEnum(Priority, invalidPriority), {
	name: "TypeError",
	message: "Invalid enum value: 3",
});

// A custom error factory adds context at the API boundary.
assert.throws(
	() => parseEnum(Priority, invalidPriority, (input) => new RangeError(`Unsupported job priority: ${String(input)}`)),
	{ name: "RangeError", message: "Unsupported job priority: 3" },
);

// These calls would fail typechecking:
// Rejected: enqueueJob(request.name, request.priority);
// Rejected: enqueueJob(request.name, "3");
// Rejected: enqueueJob(request.name, 4);
