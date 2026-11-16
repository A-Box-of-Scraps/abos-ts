import { assertNever, type EnumValue, Result } from "#src/index";
import assert from "node:assert/strict";

// Each companion object supplies runtime members; its matching type is their union.
// Literal members let TypeScript narrow exhaustive switches to never.
const JobState = {
	Queued: "queued",
	Running: "running",
	Completed: "completed",
} as const;
type JobState = EnumValue<typeof JobState>;

const JobEvent = {
	Start: "start",
	Complete: "complete",
} as const;
type JobEvent = EnumValue<typeof JobEvent>;

interface InvalidTransition {
	readonly state: JobState;
	readonly event: JobEvent;
}

// Rejected transitions are expected outcomes, not exceptions.
function transition(state: JobState, event: JobEvent): Result<JobState, InvalidTransition> {
	switch (state) {
		case JobState.Queued: {
			if (event === JobEvent.Start) {
				return Result.ok(JobState.Running);
			}
			return Result.err({ state, event });
		}
		case JobState.Running: {
			if (event === JobEvent.Complete) {
				return Result.ok(JobState.Completed);
			}
			return Result.err({ state, event });
		}
		case JobState.Completed: {
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
	assert.fail(`Unexpected rejection: ${started.error.state} + ${started.error.event}`);
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
for (const event of Object.values(JobEvent)) {
	assert.deepEqual(
		transition(JobState.Completed, event),
		Result.err({ state: JobState.Completed, event }),
	);
}

// These calls would fail typechecking:
// Rejected: transition("missing", JobEvent.Start);
// Rejected: transition(JobEvent.Start, JobEvent.Complete);
