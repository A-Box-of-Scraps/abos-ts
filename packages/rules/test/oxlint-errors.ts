import { type RuleTester } from "oxlint/plugins-dev";

const COLUMN_OFFSET = 1;

function toOxlintError(error: RuleTester.Error): RuleTester.Error {
	const expected: RuleTester.Error = { ...error, suggestions: [] };
	// Shared cases use ESLint's one-based columns; Oxlint expects zero-based columns.
	if (error.column !== undefined) {
		expected.column = error.column - COLUMN_OFFSET;
	}
	if (error.endColumn !== undefined) {
		expected.endColumn = error.endColumn - COLUMN_OFFSET;
	}
	return expected;
}

export { toOxlintError };
