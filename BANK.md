# Problem bank

Tick a problem when you start it and write its number next to it: `- [x] Promise pool → 001`.

Tags: SYS · ASYNC · TYPES · ERR · REACT · FN · DESIGN · COMM

## Weekly rhythm

| Day | Round | Pool |
| --- | ----- | ---- |
| Mon | Build and extend | A |
| Tue | Build and extend | B |
| Wed | Build and extend | C |
| Thu | Debug / review (zip from Claude) | D |
| Fri | Build and extend | E or F, alternating weeks |
| Sat | Unfamiliar codebase, or design-lite / AI-assisted | G or H, alternating weeks |
| Sun | Off, or redo the week's weakest problem | |

## A. Async and concurrency

- [ ] Promise pool: at most K at once, results in input order. Ext: fail fast, cancel the rest (ASYNC FN)
- [ ] Retry with exponential backoff and jitter, non-retryable errors, failures wrapped with `cause` (ASYNC ERR TYPES)
- [ ] `withTimeout` plus real cancellation with `AbortController` (ASYNC)
- [ ] Async queue: `take()` waits until an item arrives (ASYNC)
- [ ] Typed event emitter: `on`, `off`, `once`, payload typed per event (TYPES FN)
- [ ] Debounce and throttle with `cancel` and `flush` (FN)
- [ ] Mutex, then use it to fix a race in a shared counter (ASYNC)
- [ ] Batch loader: collect calls for 10 ms, one request, each caller gets its own result (ASYNC FN)

## B. Backend and system-level

- [ ] `runCommand` with timeout and process-group kill, written without looking at Kivo (SYS ERR)
- [ ] Stream a 1 GB log file: status counts, top paths, constant memory (SYS)
- [ ] HTTP server with no framework: routing, JSON bodies, 400/404/500 (SYS ERR)
- [ ] Graceful shutdown on SIGINT: drain in-flight work within a deadline (SYS ASYNC)
- [ ] File watcher that reruns a command, debounced, killing the previous run (SYS FN)
- [ ] Background job queue: retries, dead-letter list, concurrency limit (ASYNC ERR DESIGN)
- [ ] CLI argument parser: flags, aliases, `--`, clear errors (TYPES DESIGN)

## C. Product features

- [ ] Link shortener: codes, redirects, expiry, click counts. Ext: stats by day (DESIGN)
- [ ] Free slots from working hours and bookings. Ext: time zones, buffers (DESIGN)
- [ ] Booking that can't double-book under concurrent requests (ASYNC)
- [ ] Webhook receiver: HMAC signature, idempotency, out-of-order events (ERR DESIGN)
- [ ] Token-bucket rate limiter with an injectable clock. Ext: per-tier limits (DESIGN TYPES)
- [ ] Feature flags: per-user rules, percentage rollout stable per user (DESIGN)
- [ ] Mini agent loop against a scripted fake model: tool registry, max steps, errors as tool output (DESIGN ERR)
- [ ] Workflow runner: steps as a DAG, parallel where possible, retries (ASYNC DESIGN)
- [ ] Streaming JSON-lines parser for chunks split at random points (ASYNC)

## D. Debug / review

Claude sends a zip: buggy code, a PROBLEM.md, failing tests. Commit it untouched first
(`chore(NNN): starting code`), then fix. One review comment per bug in NOTES.md.

## E. Modelling (LLD)

- [ ] Splitwise: groups, unequal splits, simplify debts (DESIGN TYPES)
- [ ] Subscription state machine: only legal transitions, enforced by types (TYPES)
- [ ] In-memory database with nested transactions: begin, commit, rollback (DESIGN)
- [ ] KV store with TTL and LRU eviction (DESIGN)
- [ ] Roles and permissions: can this user edit this resource (DESIGN TYPES)

## F. React

- [ ] Rebuild a Kivo-style Ink app from scratch in stages: typing, transcript, agent, tools, approval (REACT ASYNC)
- [ ] `useApproval` hook (REACT)
- [ ] Autocomplete: debounced, race-safe, keyboard navigation (REACT ASYNC)
- [ ] Optimistic like button that rolls back on failure (REACT ERR)
- [ ] Infinite list with a cursor, loading and error states (REACT ASYNC)

## G. Unfamiliar codebase

A "good first issue" in cal.com, dub or mastra. The code lives in your fork; here, only a NOTES.md
with the issue link, how you found where the change goes, the PR link, what you learned. (COMM DESIGN)

- [ ] cal.com
- [ ] dub
- [ ] mastra

## H. Design-lite and AI-assisted

Design (one page in DESIGN.md, no code):
- [ ] Link click analytics at scale (DESIGN COMM)
- [ ] Recurring events across time zones (DESIGN COMM)
- [ ] Payouts ledger (DESIGN COMM)
- [ ] Run viewer for a coding agent (DESIGN COMM)

AI-assisted (DESIGN.md before the first prompt; PROMPTS.md with prompts and the bugs you caught):
- [ ] Webhook receiver (DESIGN COMM)
- [ ] Rate limiter (DESIGN COMM)
