# 002 — runCommand with timeout + process-group kill

**Pool:** B (backend and system-level) · **Round:** build and extend · **Time:** ~60–90 min
(10 min design first) · **Primer:** PRIMER.md, done before the timer
**Tags this tends to hit:** SYS, ASYNC, ERR, TYPES

## Task

You're building the part of a CI runner (or a coding agent's shell tool) that runs a command,
collects its output, and makes sure it can never hang forever.

```ts
type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null; // null if killed by a signal
  signal: NodeJS.Signals | null; // null if it exited on its own
  timedOut: boolean;
  durationMs: number;
};

type RunOptions = {
  timeoutMs: number;
  graceMs?: number; // default 2000
  cwd?: string;
};

function runCommand(
  command: string,
  args: readonly string[],
  options: RunOptions,
): Promise<RunResult>
```

## Requirements

1. Start the command with `spawn` from `node:child_process`, **without** a shell
   (`command` + `args`, not one string).
2. Collect all of stdout and stderr as strings.
3. A command that runs and exits non-zero is **not** an error: resolve with its `exitCode`.
   Example: `sh -c "exit 3"` resolves with `exitCode: 3`.
4. A command that **can't start** (e.g. doesn't exist) **rejects** with an `Error`.
5. **Timeout:** if the command is still running after `timeoutMs`:
   - send `SIGTERM` to its **whole process group** (children and grandchildren too),
   - if it's still alive after `graceMs`, send `SIGKILL` to the group,
   - resolve with `timedOut: true` and whatever output was collected.
6. If the command finishes before the timeout, **no** timers are left pending and nothing gets
   killed later.
7. The promise settles **exactly once**, no matter how many events fire.
8. `timeoutMs` must be a positive number; otherwise throw a `RangeError` **synchronously**
   (you've seen this trick in 001).
9. No `any`.

## Scratch checks (new flow: no test suite yet)

Run each, write down what you expect first, then what you got:

| Call | Expect |
| --- | --- |
| `runCommand("echo", ["hi"], { timeoutMs: 1000 })` | stdout `"hi\n"`, exit 0, not timed out |
| `runCommand("sh", ["-c", "echo oops >&2; exit 3"], { timeoutMs: 1000 })` | stderr `"oops\n"`, exit 3 |
| `runCommand("sleep", ["5"], { timeoutMs: 300 })` | timedOut, signal SIGTERM, ~300ms |
| `runCommand("sh", ["-c", "sleep 31 & sleep 32; wait"], { timeoutMs: 300 })` | timedOut, and `pgrep -fl "sleep 3"` shows nothing afterwards |
| `runCommand("sh", ["-c", "trap '' TERM; sleep 30"], { timeoutMs: 300, graceMs: 500 })` | timedOut, signal SIGKILL, ~800ms |
| `runCommand("nope-not-real", [], { timeoutMs: 1000 })` | rejects |
| `runCommand("echo", ["hi"], { timeoutMs: 0 })` | throws RangeError on the call line |
| `runCommand("echo", ["hi"], { timeoutMs: 5000 })` | script exits right away, doesn't hang 5s |

## Extensions

1. **Output cap:** `maxOutputBytes`. Stop collecting past the cap and add `truncated: true`.
2. **Cancellation:** `signal?: AbortSignal`. On abort, kill the group the same way as a timeout.
3. **Live output:** `onStdout?(chunk: string)` and `onStderr?(chunk: string)` callbacks.
4. **stdin:** an `input?: string` written to the process's stdin, then closed.

## Things an interviewer might ask

- Why `spawn` with an args array instead of `exec` or `shell: true`? What's the risk with a shell
  string built from user input?
- Why kill the process group and not just the child? Give a real command where it matters.
- Why SIGTERM first, then SIGKILL? Why not just SIGKILL?
- `exit` vs `close`: which do you wait for and why?
- How do you guarantee the promise settles exactly once?
- What happens on Windows?
- Where would you use this? (CI runners, a coding agent's bash tool, test runners, build scripts)