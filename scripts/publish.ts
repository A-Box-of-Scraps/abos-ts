import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gt, prerelease, valid } from "semver";

const registry = "https://registry.npmjs.org";
const notFound = 404;
const minimumPublishedVersions = 1;

interface Workspace {
	name: string;
	location: string;
	version: string;
	private?: boolean;
}

function isWorkspace(value: unknown): value is Workspace {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	return "name" in value && typeof value.name === "string"
		&& "location" in value && typeof value.location === "string"
		&& "version" in value && typeof value.version === "string"
		&& (!("private" in value) || typeof value.private === "boolean");
}

function publicWorkspaces(): Workspace[] {
	const data: unknown = JSON.parse(execFileSync("npm", ["query", ".workspace"], { encoding: "utf8" }));
	if (!Array.isArray(data) || !data.every(isWorkspace)) {
		throw new Error("Invalid npm workspace list");
	}
	return data.filter((workspace) => workspace.private !== true);
}

function registryVersions(metadata: unknown, name: string): string[] {
	const error = new Error(`Invalid registry metadata for ${name}`);
	if (typeof metadata !== "object" || metadata === null || !("versions" in metadata)) {
		throw error;
	}
	const { versions } = metadata;
	if (typeof versions !== "object" || versions === null || Array.isArray(versions)) {
		throw error;
	}
	const keys = Object.keys(versions);
	if (keys.length < minimumPublishedVersions || !keys.every((version) => valid(version) !== null)) {
		throw error;
	}
	return keys;
}

async function publishedVersions(name: string): Promise<string[]> {
	const response = await fetch(`${registry}/${encodeURIComponent(name)}`, {
		headers: { accept: "application/vnd.npm.install-v1+json" },
	});
	if (response.status === notFound) {
		return [];
	}
	if (!response.ok) {
		throw new Error(`Registry lookup for ${name} failed: HTTP ${response.status}`);
	}

	const metadata: unknown = await response.json();
	return registryVersions(metadata, name);
}

function shouldPublish(version: string, published: readonly string[]): boolean {
	if (valid(version) === null) {
		throw new Error(`Invalid package version: ${version}`);
	}
	return published.every((remote) => gt(version, remote));
}

function releaseChangelog(changelog: string, version: string, date: string): string {
	const heading = /^## \[Unreleased\]$/mu;
	if (!heading.test(changelog)) {
		throw new Error("Missing ## [Unreleased] heading");
	}
	if (changelog.split(/\r?\n/u).some((line) => line.startsWith(`## [${version}]`))) {
		throw new Error(`Changelog already contains version ${version}`);
	}
	const [newline = "\n"] = /\r?\n/u.exec(changelog) ?? [];
	return changelog.replace(heading, `## [Unreleased]${newline}${newline}## [${version}] - ${date}`);
}

function publish(name: string, version: string): void {
	const args = ["publish", "--workspace", name, "--registry", registry];
	// Leave the stable tag implicit so npm can reject a stale release if the registry changed since lookup.
	if (prerelease(version) !== null) {
		args.push("--tag", "next");
	}
	execFileSync("npm", args, { stdio: "inherit" });
}

function publishWorkspace({ name, location, version }: Workspace, date: string): void {
	const path = join(location, "CHANGELOG.md");
	const original = readFileSync(path, "utf8");
	writeFileSync(path, releaseChangelog(original, version, date));
	try {
		publish(name, version);
	} catch (error) {
		writeFileSync(path, original);
		throw error;
	}
	// The workflow commits these even if a later workspace fails to publish.
	execFileSync("git", ["add", "--", path]);
}

async function main(): Promise<void> {
	const candidates = await Promise.all(
		publicWorkspaces().map(async (workspace) => ({
			workspace,
			eligible: shouldPublish(workspace.version, await publishedVersions(workspace.name)),
		})),
	);
	const date = new Date().toISOString().replace(/T.*$/u, "");
	for (const { workspace, eligible } of candidates) {
		if (eligible) {
			publishWorkspace(workspace, date);
		} else {
			console.log(`Skipping ${workspace.name}@${workspace.version}`);
		}
	}
}

if (import.meta.main) {
	await main();
}

export { publishedVersions, releaseChangelog, shouldPublish };
