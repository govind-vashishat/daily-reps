# Primer for 002 — processes, signals, process groups

**Do this before the timer starts.** ~30–45 min. Run every experiment in a scratch file
(`bun scratch.ts`) and look at what actually prints. Don't skip running them; the point is seeing
the behaviour, not reading about it.

**OS note:** process groups and signals work on macOS and Linux. On Windows, use WSL for this one.

Docs to keep open:

- Node: `child_process` → `spawn`, `ChildProcess` class (events `spawn`, `error`, `exit`, `close`)
- Node: `process.kill(pid, signal)`
- Node: `stream.Readable` → `'data'` event, `setEncoding`
- `man 7 signal` (or search "SIGTERM vs SIGKILL")

---

## 1. Processes, exit codes, signals

- Every running program is a **process** with a **pid** (process id). When your code starts another
program, that's a **child process**; your program is its **parent**.
- A process ends in one of two ways:
  - It **exits on its own** with an **exit code**: `0` = success, anything else = failure.
  - It's **killed by a signal**. Then there's no exit code (`null`), and you get the signal name instead.
- **Signals** are messages the OS delivers to a process:
  - `SIGTERM`: "please stop". The process can catch it, clean up, or even ignore it.
  - `SIGKILL`: "you're dead". Can't be caught or ignored. The OS just ends it.
  - `SIGINT`: what Ctrl+C sends.
- Polite shutdown pattern: send `SIGTERM`, wait a bit (a **grace period**), then `SIGKILL` if it's
still alive.

## 2. `spawn` and its events

`spawn(command, args)` starts a process and returns a `ChildProcess` **immediately**, before
anything has run. Everything after that comes as events:

| Event | When | Args |
| --- | --- | --- |
| `spawn` | the process actually started | none |
| `error` | it couldn't start (e.g. command not found), or killing it failed | `err` |
| `exit` | the process ended | `(code, signal)` |
| `close` | the process ended **and** its stdout/stderr streams are fully closed | `(code, signal)` |

`exit` can fire before you've received all the output. `close` is the one that guarantees you have
everything.

**Experiment 1: output and exit code**

```ts
import { spawn } from "node:child_process";

const child = spawn("sh", ["-c", "echo out; echo err >&2; exit 3"]);

child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => console.log("stdout chunk:", JSON.stringify(chunk)));
child.stderr.on("data", (chunk) => console.log("stderr chunk:", JSON.stringify(chunk)));

child.on("exit", (code, signal) => console.log("exit:", code, signal));
child.on("close", (code, signal) => console.log("close:", code, signal));
```

Look at: output arrives in **chunks** (a big output would come in many), the exit code is `3`, the
signal is `null`. Try `exit 0` too.

**Experiment 2: killed by a signal**

```ts
import { spawn } from "node:child_process";

const child = spawn("sleep", ["10"]);
child.on("close", (code, signal) => console.log("close:", code, signal));

setTimeout(() => {
  console.log("sending SIGTERM");
  child.kill("SIGTERM");
}, 500);
```

Look at: `code` is `null` and `signal` is `"SIGTERM"`. That's how you tell "exited" from "was killed".

**Experiment 3: command that doesn't exist**

```ts
import { spawn } from "node:child_process";

const child = spawn("definitely-not-a-command", []);
child.on("spawn", () => console.log("spawn"));
child.on("error", (err) => console.log("error:", err.message));
child.on("exit", (code, signal) => console.log("exit:", code, signal));
child.on("close", (code, signal) => console.log("close:", code, signal));
```

Write down **which events fire and in what order**. Note: `spawn` doesn't throw here, the failure
comes as an event. And more than one "it's over" event may fire for the same process, so think about
what that means if each of them tries to resolve or reject a promise.

## 3. The grandchild problem and process groups

If your child process starts its own children (very common: `sh -c "..."`, `npm run`, test runners),
`child.kill()` only kills **the child**. The grandchildren keep running as orphans.

**Experiment 4: orphaned grandchildren**

```ts
import { spawn } from "node:child_process";

const child = spawn("sh", ["-c", "sleep 31 & sleep 32; wait"]);
child.on("close", (code, signal) => console.log("sh closed:", code, signal));

setTimeout(() => child.kill("SIGTERM"), 500);
```

While it runs and after it ends, check in another terminal: `pgrep -fl "sleep 3"`. The `sh` is gone,
the two `sleep`s are still alive. (Clean up with `pkill -f "sleep 3"`.)

**Process groups:** every process belongs to a group. Spawning with `{ detached: true }` puts the
child in a **new group** whose group id equals the child's pid; its descendants join that group.
`process.kill(-pid, signal)`, with a **negative** pid, sends the signal to **every process in
that group**.

**Experiment 5: kill the whole group**

```ts
import { spawn } from "node:child_process";

const child = spawn("sh", ["-c", "sleep 31 & sleep 32; wait"], { detached: true });
child.on("close", (code, signal) => console.log("sh closed:", code, signal));

setTimeout(() => {
  if (child.pid === undefined) return;
  process.kill(-child.pid, "SIGTERM");
}, 500);
```

Run `pgrep -fl "sleep 3"` again: all gone.

Questions to answer for yourself: what is `child.pid` if the process failed to start? What does
`process.kill` do if the group is already dead? (Try it: kill the same group twice.)

**Experiment 6: a process that ignores SIGTERM**

```ts
import { spawn } from "node:child_process";

const child = spawn("sh", ["-c", "trap '' TERM; sleep 30"], { detached: true });
child.on("close", (code, signal) => console.log("closed:", code, signal));

setTimeout(() => {
  if (child.pid === undefined) return;
  console.log("SIGTERM");
  process.kill(-child.pid, "SIGTERM");
}, 500);

setTimeout(() => {
  if (child.pid === undefined) return;
  console.log("SIGKILL");
  process.kill(-child.pid, "SIGKILL");
}, 2000);
```

Look at: nothing happens after SIGTERM. It only dies at SIGKILL, and `close` reports `SIGKILL`.

## 4. Timers keep your program alive

A pending `setTimeout` keeps the Node/Bun process running until it fires. `clearTimeout(handle)`
cancels it.

**Experiment 7**

```ts
const handle = setTimeout(() => console.log("fired"), 5000);
console.log("started");
// run once like this (exits after 5s), then add: clearTimeout(handle);
```

Why it matters: if you set a "kill it after N ms" timer and the command finishes early, that timer
is still pending. It holds your program open, and when it fires it tries to kill a process that's
already gone.

---

## Checklist before you start 002

You should be able to answer, without looking:

1. What do `code` and `signal` look like when a process exits normally vs is killed?
2. Difference between `exit` and `close`? Which one do you wait for to have all output?
3. What happens when the command doesn't exist? Does `spawn` throw?
4. Why doesn't `child.kill()` kill grandchildren, and what does?
5. SIGTERM vs SIGKILL, and why send one before the other?
6. What happens to a pending `setTimeout` if you never clear it?