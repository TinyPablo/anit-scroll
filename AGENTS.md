# tally-scroll

Single-user tally tracker. Keep it small: no ORM, no extra services, no
dependencies that a one-table app does not need.

- All code, comments and commit messages in English. Conventional commits.
- Comments are rare and explain *why*, never *what*.
- One row per (date, hour), holding a `count` capped at `MAX_PER_HOUR`.
- The period lives in `src/lib/range.ts`. Nothing else should hardcode dates.
- The server trusts `TZ`; the client sends explicit `date` and `hour`.
