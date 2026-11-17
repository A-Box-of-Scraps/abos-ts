import { publishedVersions, releaseChangelog, shouldPublish } from "#scripts/publish";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
	vi.unstubAllGlobals();
});

test.each([
	{ version: "1.0.0", published: [], expected: true },
	{ version: "1.10.0", published: ["1.9.0"], expected: true },
	{ version: "1.0.0", published: ["0.9.0", "1.0.0"], expected: false },
	{ version: "1.0.0", published: ["2.0.0", "0.9.0"], expected: false },
	{ version: "1.0.0", published: ["1.0.0-rc.1"], expected: true },
	{ version: "1.0.0-beta.10", published: ["1.0.0-beta.2"], expected: true },
	{ version: "1.0.0+other", published: ["1.0.0"], expected: false },
])("checks $version against $published", ({ version, published, expected }) => {
	// Arrange
	expect.hasAssertions();

	// Act
	const result = shouldPublish(version, published);

	// Assert
	expect(result).toBe(expected);
});

test("rolls only unreleased entries into the dated section", () => {
	// Arrange
	expect.hasAssertions();
	const previous = "## [0.1.0] - 2025-01-01\n\nOld release.\n";
	const changes = "### Added\n\n- New feature.\n";
	const changelog = `# Changelog\n\n## [Unreleased]\n\n${changes}\n${previous}`;

	// Act
	const result = releaseChangelog(changelog, "0.2.0", "2025-02-01");

	// Assert
	expect(result).toBe(`# Changelog\n\n## [Unreleased]\n\n## [0.2.0] - 2025-02-01\n\n${changes}\n${previous}`);
});

test("releases an empty Unreleased section without duplicating an existing release", () => {
	// Arrange
	expect.hasAssertions();
	const changelog = "## [Unreleased]\r\n";

	// Act
	const result = releaseChangelog(changelog, "1.0.0", "2025-01-01");

	// Assert
	expect(result).toBe("## [Unreleased]\r\n\r\n## [1.0.0] - 2025-01-01\r\n");
	expect(() => releaseChangelog(result, "1.0.0", "2025-01-02")).toThrow("already contains version");
});

test("reads all versions, not just the latest tag", async () => {
	// Arrange
	expect.hasAssertions();
	const metadata = { versions: { "0.1.0": {}, "2.0.0": {} }, "dist-tags": { latest: "0.1.0" } };
	vi.stubGlobal("fetch", async () => Response.json(metadata));

	// Act
	const versions = await publishedVersions("@example/pkg");

	// Assert
	expect(versions).toStrictEqual(["0.1.0", "2.0.0"]);
});

test.each([
	{ metadata: {} },
	{ metadata: { versions: [] } },
	{ metadata: { versions: "1.0.0" } },
	{ metadata: { versions: {} } },
	{ metadata: { versions: { latest: {} } } },
])("rejects malformed registry metadata: $metadata", async ({ metadata }) => {
	// Arrange
	expect.hasAssertions();
	vi.stubGlobal("fetch", async () => Response.json(metadata));

	// Act
	const result = publishedVersions("@example/pkg");

	// Assert
	await expect(result).rejects.toThrow("Invalid registry metadata for @example/pkg");
});

test("treats a registry 404 as unpublished", async () => {
	// Arrange
	expect.hasAssertions();
	const notFound = 404;
	vi.stubGlobal("fetch", async () => new Response(undefined, { status: notFound }));

	// Act
	const result = await publishedVersions("@example/pkg");

	// Assert
	expect(result).toStrictEqual([]);
});

test("aborts on registry errors instead of treating the package as new", async () => {
	// Arrange
	expect.hasAssertions();
	const unavailable = 503;
	vi.stubGlobal("fetch", async () => new Response(undefined, { status: unavailable }));

	// Act
	const result = publishedVersions("@example/pkg");

	// Assert
	await expect(result).rejects.toThrow(`HTTP ${unavailable}`);
});
