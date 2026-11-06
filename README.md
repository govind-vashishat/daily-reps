# daily-reps

One interview-style problem a day, written by hand: no AI during the attempt, docs allowed.
Practical rounds of the kind startups and product companies run: build and extend, debug and
review, design, working in an unfamiliar codebase.

Each problem lives in `problems/NNN-name/` with the problem, a design written before any code,
the timed attempt (never edited afterwards), notes, the review, and a from-scratch rewrite in `v2/`.

```bash
bun run new <name>        # start a problem from _template/
bun test problems/001     # run one problem's tests
bun run typecheck
bun run lint
```

See [BANK.md](BANK.md) for what's next and [WEAKPOINTS.md](WEAKPOINTS.md) for what keeps going wrong.

## Log

| #   | Problem                                  | Pool | Round | Date       | Result                 | Tags                    |
| --- | ---------------------------------------- | ---- | ----- | ---------- | ---------------------- | ----------------------- |
| 001 | Promise pool                             | A    | Build | 2026-11-04 | Pass (core), sync RangeError open | ASYNC, ERR, TYPES |
| 002 | runCommand with timeout + group kill     | B    | Build | 2026-11-07 | Pass, ESRCH bug open   | SYS, ERR, ASYNC, TYPES  |
