# 002 — runCommand: notes

## Status

- Done: spawn (no shell), output capture, non-zero exit resolves, spawn failure rejects with
  `cause`, group SIGTERM → SIGKILL, timers cleared on `close`, `cwd`, sync `RangeError`.
- Known bug: process exits right at the timeout, before `close` → `process.kill` throws `ESRCH`
  → promise rejects although the command succeeded.
- Not done: extensions, tests.

## Bugs I made

- `if (!graceMs) return;` inside the Promise executor exited the whole setup; `close` handler never
  registered → promise never settled. Optional value needs a default, not an early return.
- Grace timer started at 0 instead of at SIGTERM → SIGKILL could fire before the timeout.
- `reject("string")` → lost the real error.
- `JSON.stringify(chunk)` → output became quoted and escaped.
- `cwd: process.cwd()` → user's `cwd` ignored.

## Processes and signals

- Process ends by **exit code** (`signal` null) or by **signal** (`code` null).
- SIGTERM: polite, can be caught or ignored. SIGKILL: can't be. Pattern: SIGTERM → grace period →
  SIGKILL.
- `child.kill()` kills only the child; grandchildren become orphans.
- `spawn(..., { detached: true })` → child gets its own process group (group id = child pid).
  `process.kill(-pid, sig)` signals the whole group.
- `process.kill` on a dead group throws `ESRCH`.
- `spawn` doesn't throw for a missing command; it emits `error`. `child.pid` is then `undefined`.
- `exit`: process ended. `close`: process ended **and** stdout/stderr finished. Wait for `close`.
- Output comes in chunks; `setEncoding("utf8")` keeps multi-byte characters intact across chunks.
- A pending `setTimeout` keeps the program alive. Clear it when it's no longer needed.

## Where a throw goes

| Thrown in | Goes to | Handle with |
| --- | --- | --- |
| Normal sync code | Up the call stack | `try/catch` around the call |
| `async` function or Promise executor | Becomes a rejection | `await` in `try/catch`, or `.catch()` |
| Timer / event callback | Nobody above it → program crashes | `try/catch` **inside** the callback |

- `try/catch` around `setTimeout(...)` does **not** catch errors thrown when the callback runs later.
- To throw synchronously from a promise-returning function: validate **before** `return new Promise`
  (or before calling the async part).

## Promises: two channels

- `Promise<T>` types only the **resolve** value. The reject reason is untyped; `reject` accepts
  anything.
- `await` on resolve → returns the value. `await` on reject → **throws** the reason on that line.
- A promise settles once. Later `resolve`/`reject` calls are ignored.

## Catching

- Catch only if you can handle it: ignore an expected case, retry, fall back, or wrap and rethrow.
- Catch narrowly. `err` is `unknown`; narrow before reading fields:
  `err instanceof Error && "code" in err && err.code === "ESRCH"`.
- Wrap with context, keep the original: `new Error("what I was doing", { cause: err })`.
- Reject/throw `Error` objects, never strings (no stack, no code, no cause).

## `return` scope

- `return` exits only the function it's directly in. In a timer callback it ends that callback; in
  the Promise executor it skips everything after it.
- `child.pid === undefined` in a timer → process never started → nothing to kill → returning is
  correct. The promise was already rejected by `error`.

## v2

- ESRCH: ignore it in both catch blocks, reject with `cause` otherwise.
- Start the grace timer when SIGTERM is sent (works if SIGTERM can come from an AbortSignal too).
- Clear both timers in the `error` handler.
- `export` the function.