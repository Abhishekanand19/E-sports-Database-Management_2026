# Executed verification results

Date: 2026-10-30, Asia/Kolkata. Application implementation: commit `bcf8b59` and its ancestors. Documentation/evidence commits do not change the tested application behavior.

## Local environment

Windows, Node.js 22.19.0, Next.js 15.5.28, React 19.3.1, PostgreSQL 18 and Redis 7.0.15 under Ubuntu/WSL. Playwright Chromium provided the browser tests. A separately initialized PostgreSQL cluster on port 55432 isolated this work from the existing running PostgreSQL installation; Redis used port 56379. No existing databases were dropped or reset.

## Commands and outcomes

| Command / check                              | Actual result                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run db:seed` on fresh named database    | Baseline, numbered migrations and sample data initialized successfully                           |
| `npm run db:seed` repeated                   | No duplicate tables/data; previously applied filenames skipped                                   |
| `psql ... -v ON_ERROR_STOP=1 -f db/demo.sql` | DDL/DML/JOIN/HAVING/aggregates/view/function/index-plan executed; transaction rolled back        |
| `npm run typecheck`                          | Passed, no TypeScript diagnostics                                                                |
| `npm run build`                              | Production build passed; Next.js routes compiled                                                 |
| `npm run test:db`                            | **38 passed, 0 failed**                                                                          |
| `npm run test:api`                           | **74 passed, 0 failed** across 30 top-level cases including nested endpoint authorization checks |
| `npm run test:cache`                         | **7 passed, 0 failed**, including actual Redis and a separate unavailable-Redis process          |
| `npm run test:e2e`                           | **3 passed, 0 failed** in Chromium; final successful local replay took 16.0 seconds              |
| `npm audit --json`                           | **0 vulnerabilities** reported by the npm registry audit at verification time                    |

Total automated behavioral checks: **122 passed** (38 + 74 + 7 + 3). Build/type checks/audit are additional checks, not included in that test total. No browser or service test was counted as passing merely because its source file existed.

## What the tests prove

- SQL: keys and constraints, five advanced SQL concepts, date/roster/winner integrity, direct-SQL update bypass rejection, rollback, complete opponents, placement bounds, salted password verification.
- API: unauthenticated reads/writes denied; every mutation rejected for Viewer; Admin creates/updates/deletes entities, registers teams, schedules matches, corrects results, records statistics, releases rosters and clears records; 400/401/403/404/409/415 responses; session digest and logout revocation.
- Redis: PING, miss/hit, actual TTL expiration, generation invalidation after committed SQL writes, corrupt JSON recovery, transactional sorted-set ranking and TTL, and PostgreSQL fallback when connection fails.
- Browser: actual Admin form workflow from player creation through standings/statistics/leaderboard; invalid winner rejection; Viewer navigation on all major pages and direct API denial; mobile navigation with no document overflow. No uncaught page JavaScript errors occurred in the passing scenarios.

Earlier browser runs exposed dropdown labeling and stale route-refresh issues. Those were fixed; the successful final screenshots and logs are the evidence retained here. Test-only locator/navigation assumptions were corrected without weakening the business assertions. Generated test accounts use random passwords and are removed during cleanup. Screenshots reflect real temporary test records while those scenarios were running, so counts/names can differ from the pristine seed.

## Evidence files

The final evidence commit adds raw successful command output under `docs/evidence/` and eleven PNG captures under `docs/screenshots/`. The screenshots cover login, dashboard, players, roster, result, performance, calculated standings, Redis leaderboard, invalid-result rejection, Viewer access and mobile dashboard. They were captured from the running application, not generated mockups.

`EXPLAIN ANALYZE` during the fresh SQL demo used `stats_player_idx` for the player-stat filter. Planner decisions depend on table size and statistics; no blanket performance claim is made.

## Remote verification

GitHub Actions provisions PostgreSQL 18 and Redis 7 containers, performs two setup runs, type/format checks, all 122 automated checks, dependency audit and production build, and uploads browser evidence. A final CI run is in progress; its actual result and URL will be recorded in the final evidence commit. Previous intermediate runs are retained in GitHub history and are not represented as passing.

## Limits and manual requirements

Local Compose startup was not executed because Docker Desktop was unavailable; equivalent native/WSL services were exercised locally and the remote workflow runs the container-based checks. Only Chromium, the specified desktop viewport and a 390px mobile viewport were tested; no claim is made for every browser or device. No production hosting was tested or requested.

The ER diagram and separately completed relational-schema document were absent from the supplied source. Approved team membership, genuine contributions, section title uniqueness and originality require the team's confirmation. The README remains for the owner, as explicitly requested. These manual gaps are listed in `FINAL_COMPLIANCE_REPORT.md`.
