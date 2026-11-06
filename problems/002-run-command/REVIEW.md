# 002 — runCommand: review

## Verdict

Pass with one known bug. Core design is correct: args array (no shell), `detached` + negative pid
for the group, SIGTERM → grace → SIGKILL, resolve on `close`, non-zero exit resolves, spawn failure
rejects, timers cleared, sync validation.

## Bugs (fixed during session)

| Bug | Breaking input |
| --- | --- |
| Early `return` in executor, `close` never registered | `runCommand("echo", ["hi"], { timeoutMs: 1000 })` hangs, then crashes on kill |
| Grace timer started at 0 | `sleep 5`, `timeoutMs: 1000, graceMs: 200` → SIGKILL at 200ms, `timedOut: false` |
| `JSON.stringify(chunk)` | `echo hi` → stdout with literal quotes and `\n` |
| `cwd: process.cwd()` | `pwd` with `cwd: "/tmp"` prints the project folder |
| Rejected with a string | Missing command → no stack, no `ENOENT` |

## Open

- **ESRCH (bug):** `sleep 1` with `timeoutMs: 1000` → timer can fire after exit but before `close`
  → `process.kill` throws → catch rejects a successful run.
- Timers not cleared on `error` → script stays alive up to `timeoutMs + graceMs` after a spawn failure.
- Function not exported.

## Interviewer questions

1. Why an args array and not `shell: true`?
2. Why kill the group, not the child? Name a command where it matters.
3. Why SIGTERM before SIGKILL?
4. `exit` vs `close`?
5. How does the promise settle exactly once?
6. What if SIGTERM can be triggered by an AbortSignal at any time? (grace timer placement)
7. What happens on Windows?

## Tags

SYS (main), ERR (string reject, catch-all, where throws go), ASYNC (timer ordering), TYPES (`unknown`
in catch).