import { spawn } from "node:child_process";

type RunOptions = {
    timeoutMs: number;
    graceMs?: number;
    cwd?: string;
};

type RunResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    durationMs: number;
};

export function runCommand(
    command: string,
    args: readonly string[],
    options: RunOptions,
): Promise<RunResult> {
    const { timeoutMs, graceMs = 2000, cwd } = options;

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
        throw new RangeError("timeoutMs must be a positive integer.");
    }

    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            detached: true,
            cwd,
        });

        let start = 0;
        child.on("spawn", () => {
            start = Date.now();
        });

        let stdout = "";
        let stderr = "";

        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");

        child.stdout.on("data", (chunk) => {
            stdout += chunk;
        });
        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });

        child.on("error", (err) => {
            reject(new Error("Failed to start command", { cause: err }));
        });

        let timedOut = false;
        const timer = setTimeout(() => {
            try {
                if (!child.pid) return;
                process.kill(-child.pid, "SIGTERM");
                timedOut = true;
            } catch (error) {
                reject(new Error("Failed to terminate process group via SIGTERM"));
            }
        }, timeoutMs);

        const graceTimer = setTimeout(() => {
            try {
                if (!child.pid) return;
                process.kill(-child.pid, "SIGKILL");
            } catch (err) {
                reject(new Error("Failed to process group via SIGKILL"));
            }
        }, timeoutMs + graceMs);

        child.on("close", (exitCode, signal) => {
            clearTimeout(timer);
            clearTimeout(graceTimer);

            const now = Date.now();
            resolve({
                stdout,
                stderr,
                exitCode,
                signal,
                timedOut,
                durationMs: now - start,
            });
        });
    });
}
