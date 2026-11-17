import { assertNever, defineEnum, type EnumValue, Result } from "#src/index";
import assert from "node:assert/strict";

// Each enum supplies branded runtime members; its matching type is their union.
// Literal member values let TypeScript narrow exhaustive switches to never.
const jobStateBrand = Symbol("JobState");
const JobState = defineEnum(jobStateBrand)
	.add("Queued", "queued")
	.add("Running", "running")
	.add("Completed", "completed");
type JobState = EnumValue<typeof JobState>;

const jobEventBrand = Symbol("JobEvent");
const JobEvent = defineEnum(jobEventBrand)
	.add("Start", "start")
	.add("Complete", "complete");
type JobEvent = EnumValue<typeof JobEvent>;

interface InvalidTransition {
	readonly state: JobState;
	readonly event: JobEvent;
}

// Rejected transitions are expected outcomes, not exceptions.
function transition(state: JobState, event: JobEvent): Result<JobState, InvalidTransition> {
	switch (state.value) {
		case JobState.Queued.value: {
			if (event === JobEvent.Start) {
				return Result.ok(JobState.Running);
			}
			return Result.err({ state, event });
		}
		case JobState.Running.value: {
			if (event === JobEvent.Complete) {
				return Result.ok(JobState.Completed);
			}
			return Result.err({ state, event });
		}
		case JobState.Completed.value: {
			return Result.err({ state, event });
		}
		default: {
			// Adding a state requires handling it above before this will typecheck.
			return assertNever(state);
		}
	}
}

const started = transition(JobState.Queued, JobEvent.Start);
if (started.ok) {
	// Only successes expose value, which can feed the next transition.
	assert.equal(started.value, JobState.Running);
	const completed = transition(started.value, JobEvent.Complete);
	assert.deepEqual(completed, Result.ok(JobState.Completed));
} else {
	assert.fail(`Unexpected rejection: ${started.error.state.value} + ${started.error.event.value}`);
}

const rejected = transition(JobState.Queued, JobEvent.Complete);
if (rejected.ok) {
	assert.fail("A queued job cannot complete before starting");
} else {
	// Only failures expose error, including the rejected state and event.
	assert.equal(rejected.error.state, JobState.Queued);
	assert.equal(rejected.error.event, JobEvent.Complete);
}

// Completed is terminal: neither event can change it.
for (const event of [JobEvent.Start, JobEvent.Complete]) {
	assert.deepEqual(
		transition(JobState.Completed, event),
		Result.err({ state: JobState.Completed, event }),
	);
}

// These calls would fail typechecking:
// Rejected: transition("missing", JobEvent.Start);
// Rejected: transition(JobEvent.Start, JobEvent.Complete);
