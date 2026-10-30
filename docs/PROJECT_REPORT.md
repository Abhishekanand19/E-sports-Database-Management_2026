# E-Sports Tournament & Player Management System

## Problem, motivation and objectives

Tournament organizers need consistent records of players, historical team rosters, registration, fixtures, results and performance. Unrelated spreadsheets allow unregistered winners, overlapping rosters and inconsistent standings. This application makes PostgreSQL the authority for those rules, provides role-aware Next.js screens, and uses Redis for short-lived query results and ranked retrieval.

Objectives are to manage the tournament lifecycle, enforce integrity even outside the UI, calculate standings and player metrics from recorded facts, demonstrate advanced relational and NoSQL concepts, and provide reproducible verification.

## Scope and functional requirements

Admins create/edit/delete players, teams and tournaments; register or withdraw teams; maintain historical rosters; schedule two registered opponents; record/correct/clear results; and record/correct/remove player statistics. Viewers can read records, search players, filter performance by tournament and inspect leaderboards. Match cancellation removes dependent participation/results/stats subject to relational rules. A three-point win determines provisional standings; final placement is a separate organizer-supplied value.

Payments, external game-server synchronization, public signup, tournament bracket generation, draws and multi-opponent matches are outside this project's scope. Scores represent the winner's score followed by the loser's score; tied scores are rejected. Scheduling changes are made by cancelling and recreating a match. Player game roles remain independent of account authorization roles.

## Existing design deliverables

The provided team source included `db/schema.sql` and `db/seed.sql`, but contained no ER diagram or separate completed relational-schema document. No diagram was redrawn or invented. Attach those externally completed team deliverables and reconcile the additional `MATCH_TEAM`, authentication, audit and migration/cache tables before submission.

The original ten domain tables and their names/relationships remain. `MATCH_TEAM` adds the previously absent concept of scheduled opponents. New constraints ensure that statistics reference actual participation, each player represents only one team in a match, both result teams are scheduled, and membership periods cannot overlap.

## Architecture and database choice

Browser -> Next.js server components / client forms -> Route Handlers -> parameterized PostgreSQL queries and transactions. PostgreSQL revision triggers also make cached Redis results unusable after changes. Read-only server components share query helpers with analytics APIs; every read requires a session and every administrative API verifies the Admin role itself.

PostgreSQL is suitable for many-to-many relationships, temporal roster integrity, transactions, foreign keys, reporting and authoritative results. Redis is a NoSQL key/value and sorted-set store suitable for expiring read models and ranked kill retrieval. MongoDB and vector embeddings add no needed capability for this structured-data domain, so they were not introduced. Redis's documented sorted-set model supports score-ordered rank retrieval: https://redis.io/docs/latest/develop/data-types/sorted-sets/ .

## SQL implementation and advanced concepts

`db/schema.sql` creates the baseline. `scripts/db.ts` tracks and atomically applies `db/migrations/*.sql` under an advisory lock. `db/demo.sql` executes CREATE/ALTER/DROP on a temporary table, DML, INNER/LEFT JOIN, GROUP BY, HAVING, ordering, aggregates, subqueries, the standings view, stored functions and an actual EXPLAIN ANALYZE. The demonstration ends in ROLLBACK.

Five advanced SQL concepts are implemented:

1. Transactions: participation and statistics commit together through `lib/transaction.ts`; scheduling is one atomic stored-function call; failed migrations roll back.
2. View: `tournament_standings` calculates played/wins/losses/points from current results, including registered teams with no results.
3. Stored functions: `schedule_match` inserts a fixture and both opponents; `player_performance` filters by tournament and calculates summed kills/deaths/assists, KD and average rating.
4. Triggers: tournament dates, scheduled opponents, roster history, valid winners, birth dates, final placement and cache revisions; result changes also produce JSON audit entries.
5. Indexes: match tournament/date, statistics player ID, roster team ID, unique active roster and unique tournament placement. Primary/unique keys supply additional indexes. Small seeded tables may use sequential scans; the demo captures actual planner output without claiming universal speedups.

Deferred constraint triggers validate complete fixtures and final-placement bounds at transaction completion, permitting atomic multirow operations. A player with zero deaths has KD equal to total kills, using `greatest(total_deaths,1)`; missing ratings remain null rather than fabricated.

## Redis model and retrieval

Keys use `esports:<database-digest>:<SQL-revision>:<query-digest>`, or an explicit deployment-specific `CACHE_PREFIX`. Values are serialized query results with 60-second TTL (lookup lists: 120 seconds). The database digest isolates environments without exposing connection strings. SQL revision triggers change the version in the same transaction as every domain-table write. Readers consult that revision before retrieving Redis values, so old generations expire without blocking key scans. Redis caching reduces expensive aggregation work; PostgreSQL is still consulted for the current revision.

Leaderboard keys are Redis sorted sets. Members contain player ID/username JSON, and scores are summed kills. MULTI/EXEC replaces the set and applies TTL atomically; ZRANGE with reverse score order retrieves the top 50. Equal scores use reverse lexicographic member order consistently in SQL-fetched and Redis-fetched responses. These ranks are display ordering, not a sporting tie-break rule. Missing Redis, connection errors and malformed cached JSON fall back to SQL. Empty leaderboards return an honest empty state. A 300ms connection timeout, no offline command queue and retry cooldown prevent an unavailable Redis connection from blocking pages indefinitely.

## Authentication and security

Local bootstrap creates Admin or Viewer accounts using environment-supplied credentials. Scrypt uses random per-password salts and constant-time comparison. Random 256-bit opaque session tokens are stored only as SHA-256 hashes in PostgreSQL, expire after eight hours, and are revoked at logout. Cookies are HttpOnly, SameSite=Lax, and Secure for HTTPS production. The HTTP local demo is explicitly configured through `APP_ORIGIN`.

Mutation APIs check origin, require JSON, validate typed/length-limited input with Zod, and verify authorization before database access. Queries bind all user values. Failed logins are limited per username over a 15-minute window. Internal database errors are logged locally and returned as generic messages, while constraint failures return appropriate 400/409 responses. Browser security headers block framing and MIME sniffing. Production deployment still needs HTTPS, restricted DB credentials, backups and suitable service-level operational controls; no external deployment was requested or performed.

## Interface and evidence

The retained Next.js interface has dashboard, player search, editable entities, roster history, tournament detail/standings, scheduling, results, performance filtering and Redis leaderboard pages. Admin forms are hidden for Viewer sessions, and the same restrictions are independently enforced by APIs. Reusable forms provide pending/success/error feedback; global loading/error/not-found screens and responsive navigation support demonstrations. Actual browser captures are stored under `docs/screenshots` after successful test execution.

## Verification, conclusion and future work

See `FINAL_COMPLIANCE_REPORT.md` and `TEST_RESULTS.md` for executed checks and remaining manual deliverables. The implementation connects relational concepts to real tournament workflows rather than demonstrating isolated CRUD alone. Future work could add per-game stat models, organizer-specific permissions, bracket progression, audited actor IDs, and game-server imports, after the current domain rules are agreed by the team.

## Contribution provenance

The initial team source was read from `Ashu71771/E-Sports_DBMS` at commit `fdaf0a8c4a8e3d84fbeb0e8e8e77b9ae4c0ee26b`, authored by Git identity `Ashu71771` on 2026-10-29. It contained the baseline schema, seed, pages, queries and cache/CRUD code. That source repository was not modified or pushed to.

The destination repository was empty before this work. Its new commits use the already-configured Git identity `Abhishekanand19`; additions and imports are described separately in commit messages. These generated changes do not independently establish each student's individual academic contribution. Both students must provide accurate names, approved team information, ownership of the existing design and their genuine database/application responsibilities. No teammate commits, screenshots or contribution claims have been fabricated.
