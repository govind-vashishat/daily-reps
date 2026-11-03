# 001 — Promise pool

**Pool:** A (async and concurrency) · **Round:** build and extend · **Time:** ~2h (10 min design first)
**Tags this tends to hit:** ASYNC, FN, TYPES, ERR

## Task

You're calling an API that rate-limits you if you send too many requests at once. You have a list
of jobs (fetches, file reads, whatever) and you want to run them with **at most `limit` running at
the same time**.

Write:

```ts
function promisePool<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  limit: number,
): Promise<T[]>
```

## Requirements

1. At most `limit` tasks are in flight at any moment.
2. **Sliding window, not batches.** As soon as any task finishes, the next one starts. Running
   tasks in chunks of `limit` and waiting for the whole chunk is wrong.
3. Results come back **in input order**, not completion order.
4. Tasks start in input order.
5. **Fail fast:** if any task rejects, the returned promise rejects with that error, and no
   *new* tasks are started after that. (Tasks already running are left alone; they can't be
   cancelled yet.)
6. `tasks` is empty → resolves to `[]`.
7. `limit` must be a positive integer; otherwise throw a `RangeError` **synchronously** (before
   returning a promise). `limit` larger than `tasks.length` is fine.
8. A task that throws synchronously (instead of returning a rejected promise) is treated the
   same as a rejection.
9. No libraries. No `any`.

## Tests (at least 4, hard part first)

Suggested, pick at least four:

- Results are in input order even when later tasks finish first.
- The number of tasks in flight never exceeds `limit` (track it inside the tasks).
- Sliding window: with limit 2 and durations [100, 10, 10, 10], the whole thing takes ~100ms,
  not ~110ms+.
- A rejection rejects the pool and no further tasks start.
- Empty input, `limit` > task count, invalid `limit`.

## Extensions (if you finish early, or the interviewer pushes)

1. **Settled mode:** an option to never reject and return `PromiseSettledResult<T>[]` instead.
2. **Cancellation:** accept an `AbortSignal`. On abort, stop starting tasks and reject with the
   signal's reason. Bonus: pass the signal into each task so it can stop itself.
3. **Progress:** an `onProgress(done, total)` callback.
4. **Lazy input:** accept an `Iterable` (or `AsyncIterable`) of tasks so a million tasks
   don't all have to exist in memory up front.

## Things an interviewer might ask

- Why does the pool take `() => Promise<T>` instead of `Promise<T>[]`? What goes wrong with
  the second one?
- How is this different from `Promise.all`? From batching with `Promise.all` per chunk?
- In fail-fast mode, what happens to tasks still running after the pool rejects? To their
  errors if they reject later?
- How did you prove in your tests that the limit is respected, without relying on flaky timing?
- What's the memory cost for 1,000,000 tasks, and how would you reduce it?
- Where would you actually use this? (Kivo, scraping, bulk API calls, file processing…)