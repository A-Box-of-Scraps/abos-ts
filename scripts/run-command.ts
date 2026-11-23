import { spawn } from "node:child_process";
import { once } from "node:events";

const successExitCode = 0;

async function runCommand(command: string, args: string[]): Promise<void> {
	const child = spawn(command, args, { stdio: "inherit" });
	await once(child, "close");
	if (child.exitCode !== successExitCode) {
		throw new Error(`${command} failed: ${child.signalCode ?? String(child.exitCode)}`);
	}
}

export { runCommand };
