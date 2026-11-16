interface TestCase {
	name: string;
	code: string;
	options?: { threshold?: number; ignoreStrings?: string[]; shortString?: number }[];
}

const valid: TestCase[] = [
	{ name: "strings below the default threshold", code: "use('long enough'); use('long enough')" },
	{ name: "strings shorter than ten characters", code: "use('123456789', '123456789', '123456789')" },
	{
		name: "non-string literals",
		code: "use(1234567890, 1234567890, 1234567890, /long enough/, /long enough/, /long enough/)",
	},
	// eslint-disable-next-line no-template-curly-in-string -- This is source code passed to the parser.
	{ name: "dynamic templates", code: "use(`long enough ${a}`, `long enough ${a}`, `long enough ${a}`)" },
	{ name: "templates with invalid cooked values", code: "tag`\\unicode`; tag`\\unicode`; tag`\\unicode`" },
	{
		name: "exact exclusions",
		code: "use('long enough', 'long enough', 'long enough', 'another string', 'another string', 'another string')",
		options: [{ ignoreStrings: ["long enough", "another string"] }],
	},
	{
		name: "custom threshold",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ threshold: 4 }],
	},
	{
		name: "custom minimum length",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ shortString: 12 }],
	},
	{ name: "case-sensitive values", code: "use('long enough', 'Long enough', 'LONG ENOUGH')" },
	{ name: "untrimmed values", code: "use('long enough', ' long enough', 'long enough ')" },
];

const invalid: (TestCase & { count: number; occurrences: number })[] = [
	{ name: "default threshold", code: "use('long enough', 'long enough', 'long enough')", count: 3, occurrences: 3 },
	{
		name: "explicit defaults",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{}],
		count: 3,
		occurrences: 3,
	},
	{ name: "minimum length boundary", code: "use('1234567890', '1234567890', '1234567890')", count: 3, occurrences: 3 },
	{
		name: "more than the threshold",
		code: "use('long enough', 'long enough', 'long enough', 'long enough')",
		count: 4,
		occurrences: 4,
	},
	{
		name: "mixed quotes and static templates",
		code: "use('long enough', \"long enough\", `long enough`)",
		count: 3,
		occurrences: 3,
	},
	{
		name: "decoded escape sequences",
		code: "use('long enough', 'long\\u0020enough', `long enough`)",
		count: 3,
		occurrences: 3,
	},
	{
		name: "nested scopes",
		code: "const a = 'long enough'; function f() { return 'long enough'; } function g() { return 'long enough'; }",
		count: 3,
		occurrences: 3,
	},
	{
		name: "multiple duplicate groups",
		code: "use('long enough', 'long enough', 'long enough', 'another string', 'another string', 'another string')",
		count: 6,
		occurrences: 3,
	},
	{
		name: "lower threshold and shorter strings",
		code: "use('abc', 'abc')",
		options: [{ threshold: 2, shortString: 3 }],
		count: 2,
		occurrences: 2,
	},
	{
		name: "zero minimum length includes empty strings",
		code: "use('', '', ``)",
		options: [{ shortString: 0 }],
		count: 3,
		occurrences: 3,
	},
	{
		name: "exclusions are exact, not patterns or substrings",
		code: "use('long enough', 'long enough', 'long enough')",
		options: [{ ignoreStrings: ["long", "long.*", "Long enough", " long enough "] }],
		count: 3,
		occurrences: 3,
	},
];

export { invalid, valid };
