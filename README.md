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


### Advanced SQL Features

| Feature | Implementation |
|---|---|
| Transactions | Atomic player participation/statistics writes and migration execution |
| Views | `tournament_standings` calculates wins, losses and points |
| Stored functions | `schedule_match` and `player_performance` |
| Triggers | Validate dates, rosters, opponents, winners and placements; audit results |
| Indexes | Support tournament/date, roster and player-stat queries |

### 5. Application Code

Relevant implementation files:
### DBMS Commands Used in Our Project

1. **DDL — CREATE TABLE, Primary Keys, Foreign Keys and CHECK Constraints:**  
   [Database Schema](db/schema.sql)

2. **DML — INSERT, UPDATE and DELETE:**  
   [Player Management API](app/api/players/[id]/route.ts)

3. **Queries — SELECT, JOIN, GROUP BY, ORDER BY, Aggregates and Subqueries:**  
   [Application Database Queries](lib/queries.ts)

4. **Views — CREATE VIEW for Tournament Standings:**  
   [Advanced SQL Implementation](db/migrations/003_analytics.sql)

5. **Stored Functions — Match Scheduling and Player Performance:**  
   [Stored Functions Implementation](db/migrations/003_analytics.sql)

6. **Triggers — Automatic Validation of Match Results, Dates and Team Rosters:**  
   [Database Integrity Triggers](db/migrations/002_integrity.sql)

7. **Transactions — BEGIN, COMMIT and ROLLBACK:**  
   [Transaction Management](lib/transaction.ts)

8. **Indexes — CREATE INDEX and CREATE UNIQUE INDEX:**  
   [Database Indexes](db/migrations/001_scheduling.sql)

9. **NoSQL — Redis GET, SET and Cache Expiration:**  
   [Redis Cache Implementation](lib/cache.ts)

10. **Advanced NoSQL — Sorted Sets, Rankings and MULTI/EXEC:**  
    [Redis Leaderboard Implementation](lib/leaderboard.ts)


## 6.  Project Tree Structure

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

### 7. Application Flow

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


## 9. Run This Project on Another Laptop

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

## 10. Optional Docker Setup

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

