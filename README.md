# E-Sports Tournament & Player Management System

A DBMS mini project using Next.js, PostgreSQL and Redis to manage players, teams, tournaments, match results and player performance.

## 1. Title

**E-Sports Tournament & Player Management System**

## 2. Students' SRN and Name

| Student | SRN | Name |
|---|---|---|
| Student 1 | PES1UG24CS017 | Abhishek Anand|
| Student 2 | PES1UG24CS017 | Aashlesh P  |


## 3. Abstract

Managing e-sports tournaments requires reliable records of players, team memberships, registrations, fixtures, results and performance statistics. Maintaining these records separately can result in inconsistent standings, invalid match results and incorrect player assignments.

This project provides a web application for managing the tournament lifecycle. PostgreSQL stores authoritative relational data and enforces integrity through primary keys, foreign keys, constraints, transactions and triggers. Redis provides expiring query caches and a sorted-set player leaderboard.

The application supports two account roles. Administrators manage competition records, while Viewers can browse tournaments, teams, standings and player statistics. Features such as historical roster validation, registered-opponent scheduling, automatic standings and result correction extend the project beyond basic CRUD.

## 4. Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | Next.js, React, CSS | Pages, navigation, forms and tables |
| Backend | Next.js Route Handlers | API requests and server-side authorization |
| Language | TypeScript | Application development and type checking |
| SQL database | PostgreSQL | Relational data, integrity and reporting |
| NoSQL database | Redis | Query caching and sorted-set rankings |
| Validation | Zod | Request input validation |
| Authentication | Node.js crypto and PostgreSQL | Scrypt password hashing and hashed sessions |
| Testing | Node.js test runner and Playwright | Database, API, Redis and browser tests |
| Version control | Git and GitHub | Source code and commit history |
| Automation | GitHub Actions | Automated verification |

**Docker is optional.** The application can run with PostgreSQL and Redis installed locally. A Compose configuration is also included for developers who prefer containers.

### Main Features

- Admin and Viewer authentication.
- Player creation, editing, deletion and search.
- Team management and historical roster records.
- Tournament creation and team registration.
- Scheduling between two registered opponents.
- Match-result recording and correction.
- Automatically calculated tournament standings.
- Player statistics and tournament-specific performance.
- Redis sorted-set kill leaderboard.
- Database-level validation and transaction safety.
- Loading, error and responsive interface states.

## 5. SQL — Database Commands

### Database Setup

The project contains:

- `db/schema.sql`: original domain tables.
- `db/migrations/`: additional constraints, functions, views and support tables.
- `db/seed.sql`: sample records.
- `db/demo.sql`: executable database demonstration.

Run migrations and load sample data:

```bash
npm run db:seed
```

Apply schema changes without loading sample data:

```bash
npm run db:migrate
```

Applied files are tracked in `schema_migrations`. Repeating the setup command does not duplicate the seed data.

### Main Domain Tables

`PLAYER`, `TEAM`, `TEAM_MEMBER`, `GAME`, `TOURNAMENT`,
`PARTICIPATES_IN`, `MATCH`, `MATCH_TEAM`, `RESULT`,
`PLAYED_BY` and `PLAYER_MATCH_STATS`.

Additional tables support accounts, sessions, login attempts, result auditing, cache revisions and migrations.

### DDL: CREATE, ALTER and DROP

This demonstration uses a temporary table so application tables remain safe:

```sql
BEGIN;

CREATE TEMP TABLE ddl_demo (
    id INTEGER PRIMARY KEY
);

ALTER TABLE ddl_demo
ADD COLUMN description TEXT;

INSERT INTO ddl_demo
VALUES (1, 'DDL demonstration');

SELECT * FROM ddl_demo;

DROP TABLE ddl_demo;

ROLLBACK;
```

### DML: INSERT, SELECT, UPDATE and DELETE

The following transaction demonstrates CRUD and rolls back its changes:

```sql
BEGIN;

INSERT INTO PLAYER (
    username, country, role, date_of_birth
)
VALUES (
    'ReportDemoPlayer', 'India', 'Carry', '2001-01-01'
);

SELECT *
FROM PLAYER
WHERE username = 'ReportDemoPlayer';

UPDATE PLAYER
SET country = 'Japan'
WHERE username = 'ReportDemoPlayer';

DELETE FROM PLAYER
WHERE username = 'ReportDemoPlayer';

ROLLBACK;
```

### INNER JOIN

```sql
SELECT p.username, s.match_id, s.kills, s.deaths
FROM PLAYER p
INNER JOIN PLAYER_MATCH_STATS s
    ON p.player_id = s.player_id
ORDER BY s.kills DESC;
```

### LEFT JOIN and GROUP BY

```sql
SELECT t.team_name, COUNT(tm.player_id) AS active_players
FROM TEAM t
LEFT JOIN TEAM_MEMBER tm
    ON t.team_id = tm.team_id
    AND tm.status = 'active'
GROUP BY t.team_id, t.team_name
ORDER BY active_players DESC, t.team_name;
```

### Aggregation, HAVING, ORDER BY and Subquery

```sql
SELECT p.username, SUM(s.kills) AS total_kills
FROM PLAYER p
JOIN PLAYER_MATCH_STATS s
    ON p.player_id = s.player_id
WHERE p.player_id IN (
    SELECT player_id FROM PLAYED_BY
)
GROUP BY p.player_id, p.username
HAVING SUM(s.kills) > 20
ORDER BY total_kills DESC;
```

### Advanced SQL Features

| Feature | Implementation |
|---|---|
| Transactions | Atomic player participation/statistics writes and migration execution |
| Views | `tournament_standings` calculates wins, losses and points |
| Stored functions | `schedule_match` and `player_performance` |
| Triggers | Validate dates, rosters, opponents, winners and placements; audit results |
| Indexes | Support tournament/date, roster and player-stat queries |

View tournament standings:

```sql
SELECT *
FROM tournament_standings
WHERE tournament_id = 1
ORDER BY points DESC, team_name;
```

Calculate performance for one tournament:

```sql
SELECT *
FROM player_performance(1);
```

Calculate performance across all tournaments:

```sql
SELECT *
FROM player_performance(NULL);
```

Demonstrate transactional scheduling using the supplied seed:

```sql
BEGIN;

SELECT schedule_match(
    1,
    '2026-08-20',
    'Demo Final',
    1,
    2
);

ROLLBACK;
```

Inspect result audit history:

```sql
SELECT entity, operation, changed_at
FROM audit_log
ORDER BY audit_id DESC
LIMIT 10;
```

Inspect an actual query plan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM PLAYER_MATCH_STATS
WHERE player_id = 1;
```

The planner's index choice depends on table size and database statistics.

## 6. NoSQL Database Commands — Redis

Redis stores derived data. PostgreSQL remains the authoritative database.

### Application Redis Operations

- `GET`: retrieve cached JSON results.
- `SET ... EX`: cache results with an expiration.
- `ZADD`: store player leaderboard scores.
- `ZRANGE ... REV WITHSCORES`: retrieve ranked players.
- `MULTI` and `EXEC`: atomically replace leaderboard data and set its TTL.
- `EXPIRE` and `TTL`: manage and inspect expiration.

Query results normally expire after 60 seconds; lookup lists expire after 120 seconds.

Domain-table writes advance a PostgreSQL cache revision. Redis keys include this revision, preventing older cached results from being reused after changes.

### Standalone Redis Demonstration

Open a Redis command-line session:

```bash
redis-cli
```

Run:

```redis
PING

SET report:demo:status "Tournament active" EX 60
GET report:demo:status
TTL report:demo:status

MULTI
ZADD report:demo:leaderboard 40 ShadowAce 37 Tigra 27 Kaze
EXPIRE report:demo:leaderboard 60
EXEC

ZRANGE report:demo:leaderboard 0 9 REV WITHSCORES
TYPE report:demo:leaderboard
TTL report:demo:leaderboard

DEL report:demo:status report:demo:leaderboard
```

These `report:demo:*` keys are isolated demonstration keys.

To inspect actual application keys after opening its pages:

```bash
redis-cli --scan --pattern 'esports:*'
```

Copy a returned key and inspect it:

```redis
TYPE <actual-key>
TTL <actual-key>
```

For a JSON cache key:

```redis
GET <actual-key>
```

For a leaderboard sorted-set key:

```redis
ZRANGE <actual-key> 0 9 REV WITHSCORES
```

If Redis is unavailable, application reads fall back to PostgreSQL.

Vector search is optional under the project requirements and is not used because this project uses the SQL + NoSQL approach.

## 7. Next.js Project Tree Structure

The following tree summarizes the main application files:

```text
E-sports-Database-Management_2026/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── session/
│   │   ├── matches/
│   │   ├── participations/
│   │   ├── players/
│   │   ├── results/
│   │   ├── stats/
│   │   ├── team-members/
│   │   ├── teams/
│   │   └── tournaments/
│   ├── leaderboard/
│   ├── login/
│   ├── matches/
│   ├── players/
│   ├── stats/
│   ├── teams/
│   ├── tournaments/
│   │   └── [id]/
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── ActionButton.tsx
│   ├── DeleteButton.tsx
│   ├── EntityForm.tsx
│   ├── RecordActions.tsx
│   ├── SessionControls.tsx
│   └── SessionProvider.tsx
├── db/
│   ├── migrations/
│   ├── demo.sql
│   ├── schema.sql
│   └── seed.sql
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── cache.ts
│   ├── db.ts
│   ├── http.ts
│   ├── leaderboard.ts
│   ├── password.ts
│   ├── queries.ts
│   ├── redis.ts
│   ├── transaction.ts
│   └── validation.ts
├── scripts/
│   ├── create-user.ts
│   └── db.ts
├── tests/
│   ├── browser/
│   ├── api.test.ts
│   ├── cache.test.ts
│   └── database.test.ts
├── docs/
│   ├── evidence/
│   ├── screenshots/
│   ├── DATA_DICTIONARY.md
│   ├── DEMO_GUIDE.md
│   ├── FINAL_COMPLIANCE_REPORT.md
│   ├── PROJECT_REPORT.md
│   ├── SETUP.md
│   └── TEST_RESULTS.md
├── .github/workflows/verify.yml
├── .env.local.example
├── compose.yaml
├── next.config.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
└── tsconfig.json
```

### Application Flow

```text
Browser
   |
Next.js pages and forms
   |
Server components / API Route Handlers
   |
Authentication and input validation
   |
PostgreSQL queries and transactions
   |
Redis query cache and leaderboard
```

## 8. Sample Screenshots of Application Code and Demo

The screenshots below were captured from actual browser tests. Temporary test names and counts may differ from a fresh seed.

### Login

![Login page](docs/screenshots/01-sign-in.png)

### Dashboard

![Dashboard](docs/screenshots/02-dashboard.png)

### Players

![Player management](docs/screenshots/03-players.png)

### Team Roster

![Team roster management](docs/screenshots/04-team-roster.png)

### Match Results

![Match result recording](docs/screenshots/05-match-result.png)

### Player Statistics

![Player statistics](docs/screenshots/06-player-statistics.png)

### Calculated Standings

![Tournament standings](docs/screenshots/07-calculated-standings.png)

### Redis Leaderboard

![Redis leaderboard](docs/screenshots/08-redis-leaderboard.png)

### Invalid Result Rejection

![Invalid result rejected](docs/screenshots/09-invalid-result-rejected.png)

### Mobile View

![Mobile dashboard](docs/screenshots/11-mobile-dashboard.png)

### Application Code

Relevant implementation files:

- [PostgreSQL schema](db/schema.sql)
- [Database migrations](db/migrations/)
- [Authentication](lib/auth.ts)
- [Transactional statistics API](app/api/stats/route.ts)
- [Redis cache](lib/cache.ts)
- [Sorted-set leaderboard](lib/leaderboard.ts)
- [Reusable form component](components/EntityForm.tsx)

> Before submission, add a few editor screenshots of these code files to this section. Code screenshots have not been supplied here; the links above show the actual implementation.

## 9. Evaluation Rubrics — Completion Status

The statuses below describe implementation and recorded verification, not an awarded grade.

| Requirement | Status | Evidence |
|---|---|---|
| Meaningful project beyond CRUD | Completed | Tournament lifecycle, roster rules, standings and performance |
| PostgreSQL implementation | Verified | Schema, migrations and database tests |
| SQL DDL and DML | Verified | Executable SQL demonstration and tests |
| Joins, aggregation and subqueries | Verified | Queries, reporting functions and SQL demo |
| Four advanced SQL concepts | Verified | Transactions, views, functions, triggers and indexes |
| NoSQL implementation | Verified | Redis query cache and sorted-set leaderboard |
| Advanced NoSQL functionality | Verified | Ranked sorted-set retrieval, transactions and TTL |
| Next.js interface | Verified | Admin, Viewer and mobile browser scenarios |
| Database/API integration | Verified | API tests and real SQL record assertions |
| Authentication and two roles | Verified | Admin/Viewer permissions and session tests |
| Database-level integrity | Verified | Invalid dates, opponents, rosters, results and statistics rejected |
| Production build and type checking | Passed | Recorded build and TypeScript output |
| Automated behavioral checks | Passed | 122 recorded passing checks |
| Application demo screenshots | Available | `docs/screenshots/` |
| Application code screenshots | To attach | Add editor captures before submission |
| ER diagram and separate relational-schema document | To attach | Add the team's completed deliverables |
| Students' SRNs, names and genuine contributions | To complete | Replace placeholders and record actual responsibilities |
| Section title uniqueness and originality confirmation | Team confirmation required | Confirm with the instructor |

### Recorded Test Results

| Test suite | Passed |
|---|---:|
| Database tests | 38 |
| API checks, including nested permission checks | 74 |
| Redis tests | 7 |
| Browser scenarios | 3 |
| **Total** | **122** |

These results were recorded on **30 October 2026**. Rerun the tests after making changes.

- [Detailed test results](docs/TEST_RESULTS.md)
- [Requirements compliance report](docs/FINAL_COMPLIANCE_REPORT.md)
- [Successful GitHub Actions verification](https://github.com/Abhishekanand19/E-sports-Database-Management_2026/actions/runs/41052511535)

## 10. Run This Project on Another Laptop

### Prerequisites

Install:

- Git.
- Node.js 22 or later, including npm.
- PostgreSQL 18.
- Redis 7 or later.

Windows users can run Redis inside Ubuntu using WSL. Docker is not required.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Abhishekanand19/E-sports-Database-Management_2026.git
cd E-sports-Database-Management_2026
npm ci
```

### Step 2: Create a PostgreSQL Database

Open SQL Shell (`psql`) or pgAdmin's Query Tool as the PostgreSQL administrator.

Run the following after replacing the password placeholder with your own private password:

```sql
CREATE USER esports
WITH PASSWORD 'REPLACE_WITH_YOUR_PRIVATE_DATABASE_PASSWORD';

CREATE DATABASE esports_db
OWNER esports;
```

Run these commands separately if your database tool automatically wraps statements in a transaction.

Use a new database for this project. Do not overwrite another application's database.

### Step 3: Start Redis

On Linux, start the installed Redis service:

```bash
sudo systemctl start redis-server
redis-cli ping
```

On Windows with Ubuntu already installed in WSL, open Ubuntu and run:

```bash
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

Expected response:

```text
PONG
```

Keep Redis available while running the project.

### Step 4: Configure Environment Variables

In the project folder, copy the example file.

PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

macOS/Linux:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```dotenv
DATABASE_URL=postgresql://esports:YOUR_PRIVATE_DATABASE_PASSWORD@127.0.0.1:5432/esports_db
REDIS_URL=redis://127.0.0.1:6379
APP_ORIGIN=http://localhost:3000
```

The database password must match the PostgreSQL user created in Step 2.

If the password contains URL-special characters, URL-encode it inside `DATABASE_URL`. Update ports if your services use different ports.

The `POSTGRES_PASSWORD` variable in the example file is only needed for the optional Docker Compose setup.

**Do not commit `.env.local`, passwords or session tokens to GitHub.**

### Step 5: Apply Migrations and Load Sample Data

```bash
npm run db:seed
```

A fresh seeded database contains:

- 6 players.
- 4 teams.
- 3 games.
- 2 tournaments.
- 3 matches.
- Sample rosters, results and player statistics.

### Step 6: Create Your Own Admin Account

There is no shared default account in a fresh installation. Each developer creates their own credentials.

The account creation script requires a password between **12 and 256 characters**. Usernames are normalized to lowercase.

#### Windows PowerShell

Run from the project folder:

```powershell
$env:BOOTSTRAP_USERNAME = Read-Host 'Choose your admin username'
$env:BOOTSTRAP_ROLE = 'admin'

$secret = Read-Host 'Choose password (minimum 12 characters)' -AsSecureString
$env:BOOTSTRAP_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password

npm run user:create

Remove-Item Env:BOOTSTRAP_PASSWORD
```

#### macOS/Linux Bash

```bash
read -rp "Choose your admin username: " BOOTSTRAP_USERNAME
export BOOTSTRAP_USERNAME
export BOOTSTRAP_ROLE=admin

read -rsp "Choose password (minimum 12 characters): " BOOTSTRAP_PASSWORD
echo
export BOOTSTRAP_PASSWORD

npm run user:create

unset BOOTSTRAP_PASSWORD
```

Passwords are stored as salted scrypt hashes.

An existing username is rejected rather than silently overwritten. Choose a different username when creating an additional account.

### Step 7: Create a Viewer Account

Repeat the account creation commands with a different username and password, changing the role to:

PowerShell:

```powershell
$env:BOOTSTRAP_ROLE = 'viewer'
```

Bash:

```bash
export BOOTSTRAP_ROLE=viewer
```

Then run:

```bash
npm run user:create
```

Supply the username and password environment variables again, as in Step 6.

### Step 8: Start the Application

```bash
npm run dev
```

Open:

**http://localhost:3000/login**

Sign in using the account created on your laptop.

The database and accounts are local to each installation. Cloning the repository does not copy another developer's database or login credentials.

### Subsequent Runs

After the initial setup:

1. Start PostgreSQL.
2. Start Redis.
3. Open the project folder.
4. Run `npm run dev`.
5. Open `http://localhost:3000/login`.

You do not need to recreate the database, seed or Admin account every time.

### Production Build

```bash
npm run typecheck
npm run build
npm run start
```

Stop the development server before starting production mode on the same port.

## 11. Optional Docker Setup

Developers who prefer containers can use the supplied `compose.yaml` instead of installing PostgreSQL and Redis separately.

Start Docker Desktop, copy `.env.local.example` to `.env.local`, and configure matching private passwords:

```dotenv
POSTGRES_PASSWORD=YOUR_PRIVATE_DATABASE_PASSWORD
DATABASE_URL=postgresql://esports:YOUR_PRIVATE_DATABASE_PASSWORD@127.0.0.1:5432/esports_db
REDIS_URL=redis://127.0.0.1:6379
APP_ORIGIN=http://localhost:3000
```

Then run:

```bash
docker compose --env-file .env.local up -d --wait
npm run db:seed
```

Create accounts using Step 6, then start Next.js:

```bash
npm run dev
```

Docker runs only the database services in this setup. Next.js runs through npm.

Do not run native and Docker database services on the same ports simultaneously.

## 12. Testing

Use a separate fresh, seeded test database. Run suites sequentially against that database.

Database and Redis tests:

```bash
npm run test:db
npm run test:cache
```

With the application running against the same test database, open another terminal and run:

```bash
npm run test:api
npx playwright install chromium
npm run test:e2e
```

Additional checks:

```bash
npm run typecheck
npm run format:check
npm run build
npm audit --audit-level=high
```

Test accounts use generated passwords and are cleaned up after execution.

## 13. Troubleshooting

| Problem | Solution |
|---|---|
| `npm` is not recognized | Install Node.js and reopen the terminal |
| `psql` is not recognized | Use SQL Shell, pgAdmin, or add PostgreSQL's `bin` directory to PATH |
| PostgreSQL connection refused | Start PostgreSQL and check the host/port in `DATABASE_URL` |
| Password authentication failed | Match `DATABASE_URL` to the PostgreSQL user's password |
| Redis connection refused | Start Redis and check `REDIS_URL` |
| Invalid login | Create an account on this database and use its chosen credentials |
| Account creation fails | Use a unique username and a password of at least 12 characters |
| Too many login attempts | Wait for the 15-minute login-attempt window to expire |
| Tables are missing | Run `npm run db:seed` |
| Port 3000 is already in use | Stop the existing server or configure a different port and matching `APP_ORIGIN` |
| Team withdrawal/deletion is rejected | Remove dependent scheduled matches and records first |
| Viewer cannot edit records | This is expected; administrative changes require the Admin role |

## 14. Additional Documentation

- [Project Report](docs/PROJECT_REPORT.md)
- [Data Dictionary](docs/DATA_DICTIONARY.md)
- [Detailed Setup](docs/SETUP.md)
- [Demonstration Guide](docs/DEMO_GUIDE.md)
- [Test Results](docs/TEST_RESULTS.md)
- [Final Compliance Report](docs/FINAL_COMPLIANCE_REPORT.md)
