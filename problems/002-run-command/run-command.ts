import { spawn } from "node:child_process";

type RunOptions = {
    timeOutMs: number;
    graceMs?: number;
    cwd?: string;
}

type RunResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    durationMs: number;
}

function runCommand(
    command: string,
    args: readonly string[],
    options: RunOptions,
): Promise<RunResult>  {
    return new Promise((resolve, reject) => {
        const { timeOutMs, graceMs = 2000 } = options;

        const child = spawn(command, args, { detached: true });

        let start = 0;
        child.on("spawn", () => { start = Date.now() })

        let stdout = "";
        let stderr = "";
        let exitCode = null;
        let signal = null;
        let durationMs = 0;
        
        child.stdout.on("data", ((chunk) => 
            { stdout += chunk }
        ));
        child.stderr.on("data", ((chunk) => 
            { stderr += chunk }
        ));
        
        child.on("error", (err) => {
            reject(err.message);
        });

        let timedOut = false;
        const timer = setTimeout(() => {
            if(!child.pid) return;
            process.kill(-child.pid, "SIGTERM")
            timedOut = true;
        }, timeOutMs);

        const graceTimer = setTimeout(() => {
            if (!child.pid) return;
            process.kill(-child.pid, "SIGKILL")
        }, timeOutMs + graceMs);

        child.on("close", (code, sig) => {
            exitCode = code;
            signal = sig;
            clearTimeout(timer);
            clearTimeout(graceTimer);

            const now = Date.now();
            durationMs = now - start;

            resolve({
                stdout,
                stderr,
                exitCode,
                signal,
                timedOut,
                durationMs
            });
        })
    })
}