# 001 — Promise pool: review

Reviewed version: the sliding-window pool with `Set` + `Promise.race` + `Promise.all`,
with the `>=` fix applied.

## Verdict

**Pass on the core problem.** The final version is a correct sliding-window pool: at most `limit`
in flight, the next task starts as soon as a slot frees up, results in input order, fail-fast on
the first rejection, empty input handled. That's the part this round actually tests.

Honest context: it took two sessions and a lot of hints to get there, mostly because promises and
`Promise.race` were new. Once the tools were known, the design came together quickly. In a real
round you'd need to get to this version in ~45–60 minutes, which is what pool A is for.

## Bugs found during the session

1. **`.then` instead of waiting (first version).** `promise.then(cb)` only schedules `cb`; the loop
   kept going, every task started at once, and the function returned `results` while it was still
   `[]`. Results were pushed later in finish order. Breaking input: any task with a delay.
   Fixed by waiting on the promises.
2. **Swallowed errors (first version).** `try/catch` with `console.error` turned a `RangeError`
   into a resolved `undefined`. Breaking input: `promisePool(tasks, 0)` resolved instead of
   failing. Fixed by removing the try/catch.
3. **Off-by-one on the limit.** `pool.size > limit` let `limit + 1` tasks run. Breaking input:
   `limit = 1`, two tasks: both start at once. Fixed with `>=`.

Note: the manual run with 3 tasks and limit 2 would have passed with bug 3 still in it, since it
only checked order, not concurrency or timing.

## Still open

- **Requirement 7, synchronous `RangeError`.** The function is `async`, so the throw becomes a
  rejection. Breaking input: `promisePool(tasks, 0)` called without `await` doesn't throw on that
  line. Fix: a non-async wrapper that validates, then returns the promise from an async inner
  function.
- **`Set<unknown>`.** Should be typed as what's actually stored (the promise returned by
  `.then(...).finally(...)`).
- **Cleanup** (if not done yet): the auto-imported `resolve` from `node:dns`, the `console.log`
  inside the pool, and the scratch tasks + top-level `await` living in the solution file.
- **Tests:** deferred under the new flow; backfill in the testing pass.

## What's good

- Results stored by index (`results[i] = response`), so order doesn't depend on finish order.
- `.finally` frees the slot whether the task succeeded or failed.
- Fail-fast falls out of the structure: a rejected task rejects the race, the `await` throws,
  and the loop stops starting new tasks. No extra code needed.
- A task that throws synchronously becomes a rejection of the pool (requirement 8).

## Questions an interviewer would ask

1. Why does the pool take `() => Promise<T>` instead of `Promise<T>[]`?
2. Why `if` and not `while` before `Promise.race`? Is `if` always enough?
3. After the pool rejects, what happens to tasks still running? If one rejects later, does anything
   break (unhandled rejection)?
4. Why does the set hold `executePromise` and not `taskPromise`?
5. How would you prove in a test that the limit is respected, without flaky timing?
6. What does this cost in memory for 1,000,000 tasks, and how would you reduce it?

## Weak-point tags

- **ASYNC** (main one): `.then` vs waiting, what `async` does to throws, the event loop order.
- **ERR**: catching and logging instead of letting the error reach the caller.
- **TYPES**: `Set<unknown>`, untyped `new Promise(...)` making `T` become `unknown`.

## For v2 (from scratch, no looking)

- Sync validation wrapper + async inner function.
- Properly typed set, no stray imports or logs, solution file exports only `promisePool`.
- Be able to answer questions 1–4 above out loud.