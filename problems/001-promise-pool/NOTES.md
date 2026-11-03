# 001 — Promise pool: notes

## Result

- **Done:** base problem. Sliding window, at most `limit` in flight, results in input order,
  fail-fast on the first rejection, empty input returns `[]`, invalid `limit` rejects with `RangeError`.
- **Not done:** synchronous `RangeError` (requirement 7), extensions 1–4.
- **Tests:** deferred (new flow: scratch run now, `bun:test` suite in a later pass).
- **Time:** two sessions over two days, with a lot of hints. Most of that was learning how promises
  work; once I knew the tools, the actual solution came together in under an hour.

## What went wrong

- **Root cause: I didn't know the tools.** I didn't really know how promises worked and didn't know
  `Promise.race` existed, so I couldn't come up with any approach at first.
- **`.then` doesn't wait.** My first version called every task and attached `.then` in a loop.
  `.then` just schedules a callback for when the promise settles and returns immediately, so all
  tasks started at once and the function returned `results` while it was still `[]`.
- **`push` gives finish order.** Pushing results in the `.then` callback stored them in the order
  they finished, not input order.
- **Swallowed errors.** I wrapped everything in `try/catch` with `console.error`. A bad `limit`
  got logged and the function resolved with `undefined`, so the caller never found out.
- **Off-by-one on the limit.** `pool.size > limit` let `limit + 1` tasks run. With `limit = 1` and
  two tasks, both started at once. Fixed with `>=`.
- **My manual run wouldn't have caught that bug.** 3 tasks with limit 2 printed the right order
  with `>` too. It only checked order, not how many ran at once or how long it took.
- **Index typing.** `tasks[i]()` errored because indexing can return `undefined`; switched to
  `for (const [i, task] of tasks.entries())`.
- **Sloppy leftovers:** an auto-imported `resolve` from `node:dns`, a `console.log` in the pool,
  `Set<unknown>`, and scratch code sitting in the solution file.

## What I'd tell the interviewer

- I keep a set of tasks that are currently running. Before starting the next task, if the set is
  full, I wait on `Promise.race` of the set, which resolves as soon as any one of them settles.
- Each running task is wrapped so that when it finishes it stores its result at its own index and
  removes itself from the set (in `.finally`, so it happens on success or failure).
- After the loop, I `await Promise.all` on whatever is still running, then return the results.
- Results are stored by index, so the output is in input order no matter which task finishes first.
- Fail-fast comes for free: if a task rejects, the race (or the final `Promise.all`) rejects, the
  `await` throws, the loop stops, and no new tasks start. Tasks already running keep going, since
  there's no way to cancel them yet.
- It's concurrency, not parallelism: JS runs on one thread, and what overlaps is the waiting
  (timers, network).
- The pool takes functions, not promises, because a promise starts running the moment it's
  created. Functions let the pool decide *when* each task starts.

## What I learned

- An `async` function runs synchronously until its first `await`, then returns a promise. The
  result doesn't exist yet, so a promise is the only thing it can return.
- Any `throw` inside an `async` function becomes a rejected promise, even on the first line. To
  throw synchronously, validate in a normal function and then call the async part.
- `Promise.race` settles with whichever promise settles first, including a rejection.
- `.then` / `.finally` return new promises and pass rejections through.

## With more time

- Split into a non-async wrapper (validation, real sync `RangeError`) and an async inner function.
- Type the set properly instead of `Set<unknown>`.
- Write the `bun:test` suite: order, max-in-flight counter, sliding-window timing, rejection,
  empty input, invalid limit.
- Extensions: settled mode, `AbortSignal`, progress callback, lazy iterable input.
