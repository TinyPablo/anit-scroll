# Tally

A fixed two-week grid for noticing when you reach for a time waster. Hours run
down the Y axis, days across the X axis. Catch yourself opening YouTube or
Instagram, mark the hour, and keep going - the point is the moment of awareness,
not stopping. One mark per hour is the maximum; coming back fifteen minutes
later is still the same mark.

## Stack

Next.js 16, React 19, Tailwind 4, shadcn (base-nova, Base UI), SQLite through
better-sqlite3 with no ORM. One Docker container.

## Period

`src/lib/range.ts` holds `START_DATE` and `DAYS`. The current period is
2026-10-03 through 2026-10-17. Changing the period is a one-line edit; existing
rows outside the new window stay in the database but are not shown.

## Time zone

The container runs with `TZ=Europe/Warsaw` (see `docker-compose.yml`) so the
server's wall clock matches the browser's. The browser sends an explicit `date`
and `hour`; the server never infers a zone.

## Auth

A single password from `APP_PASSWORD`, exchanged for a session cookie signed
with `SESSION_SECRET` and valid for a year. `src/proxy.ts` guards `/` and
`/api/tallies`.

## Local development

```bash
cp .env.example .env   # fill APP_PASSWORD and SESSION_SECRET
npm install
npm run dev
```

## Deployment

Manual, on the server:

```bash
cd ~/projects/anit-scroll
git pull
docker compose up -d --build
```

The container listens on `127.0.0.1:3003`; `cloudflared` maps
`tally.pawelzawada.dev` to it. The SQLite file lives in `./data`, bind-mounted.
