# Evaluation demonstration

Follow `SETUP.md` on a fresh database, seed once, and create private Admin and Viewer accounts. Keep the production server running at `http://localhost:3000`. Passwords are chosen locally; none are published.

1. **Problem and design:** explain the need for reliable registration, historical rosters and validated competition results. Present the team's existing ER diagram and relational-schema document once attached. The executable baseline is `db/schema.sql`; migrations explain additions. Those external diagrams are currently missing from the supplied source.
2. **Login and dashboard:** open `/login`, sign in as Admin, then `/`. On the untouched seed, counts are six players, four teams, two tournaments and three matches. Counts come from PostgreSQL, with a Redis source badge after caching.
3. **Player CRUD and search:** open `/players`; search `ShadowAce`, then clear the search. Add `DemoAce`, India, Carry, 2001-01-01. Expand its Edit action, change country to Japan and save. Use Delete on an extra throwaway player to demonstrate confirmation and deletion.
4. **Team/roster:** open `/teams`; add `Demo Falcons`. In Add player to team, assign DemoAce to Demo Falcons with join date 2026-01-01 and active status. Roster and roster history should refresh. Attempt assigning that player to another overlapping team: the DB rejects it.
5. **Tournament registration:** open `/tournaments`; create `Demo Cup`, Valorant, 2026-11-01 to 2026-11-30, prize 1000. Open its detail link. Register Demo Falcons and Night Owls, leaving final placement blank. Both appear with zero provisional points.
6. **Schedule:** open `/matches`; choose Demo Cup, date 2026-11-10, round Final, opponents Demo Falcons and Night Owls. Save. Both teams must already be registered; an outside date or unregistered opponent is rejected atomically without leaving a partial fixture.
7. **Result:** in Record match result, choose the new fixture, Demo Falcons as winner, Night Owls as loser, score 13-7. Revisit tournament details: Demo Falcons has one win and three points. Correct the same fixture with Night Owls as winner and 13-8; points move automatically. `audit_log` records the correction.
8. **Statistics:** open `/stats`; choose the new fixture, Demo Falcons, DemoAce, kills 28, deaths 7, assists 6, damage 2200 and rating 1.30. Save. Filter by Demo Cup: the line has KD 4. A wrong team or negative value is rejected. Correcting the same player's line updates it rather than duplicating participation.
9. **Advanced NoSQL:** open `/leaderboard`, filter by Demo Cup and refresh. DemoAce's score is 28 and a subsequent source badge reads Redis. The backing key is a Redis sorted set with a TTL; see commands below. Record a changed statistic and refresh: a new SQL revision is used so older cached results cannot be served.
10. **Integrity/security:** try recording Phoenix Rising as the new fixture's winner even though it was not scheduled. The request is rejected and the previous result remains. Sign out, sign in as Viewer, open all pages and confirm admin forms/actions are absent. In browser developer tools, a JSON POST to `/api/players` returns 403 for a Viewer session.
11. **SQL and test evidence:** run the commands below; show the standings view, player function, scheduling function/rollback, audit trigger and index plan. Present `TEST_RESULTS.md`, browser screenshots, and the honest contribution notes in `PROJECT_REPORT.md`.

## Executable SQL demonstration

With native psql and `DATABASE_URL` exported in the shell:

```powershell
psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 -f db/demo.sql
```

Or, when using Compose:

```powershell
Get-Content -Raw db/demo.sql | docker compose --env-file .env.local exec -T postgres psql -U esports -d esports_db -v ON_ERROR_STOP=1
```

Known seed results: Phoenix Rising has two wins/six points in Champions Clash; ShadowAce has 40 kills, 19 deaths and KD 2.11 in that tournament. The demo's temporary schedule is rolled back. PostgreSQL sequences can advance even after rollback, so do not expect newly created IDs to be contiguous.

## Redis commands

In bash or a Redis client, scan the `esports:*` namespace rather than using blocking KEYS. On Compose:

```powershell
docker compose --env-file .env.local exec redis redis-cli --scan --pattern 'esports:*'
```

Copy the key for the leaderboard after opening its page. Then run `TYPE <key>`, `TTL <key>` and `ZREVRANGE <key> 0 9 WITHSCORES` using `redis-cli`. TYPE is `zset`, TTL is at most 60 seconds, and scores are total kills. Query-cache keys have TYPE `string` and JSON values. Expired/old-generation keys may already be absent, so reopen the page and rescan.

## Automated replay

```powershell
npm run test:db
npm run test:cache
npm run test:api
npm run test:e2e
```

The API suite creates its own accounts and fixtures, checks every mutation path as unauthenticated and Viewer, executes the lifecycle, and cleans up. Browser tests use real forms and capture eleven screenshots. Generated browser fixture names differ each run. Use the supplied seed and a separate test database; avoid running these suites concurrently.

After the manual demo, remove the new fixture before withdrawing its teams, and remove player statistics/participation before deleting the corresponding roster membership. Existing matches are preserved unless explicitly cancelled.
