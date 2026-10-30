# Reproducible setup

Requires Node.js 22+, npm, PostgreSQL 18 and Redis 7. Docker Compose can provide the databases. Keep secrets in ignored `.env.local` or environment variables.

## Fresh installation

```powershell
npm ci
Copy-Item .env.local.example .env.local
```

Edit `.env.local`: replace both password placeholders with the same private password, and URL-encode it inside `DATABASE_URL` if it contains URL punctuation. `APP_ORIGIN` must match the browser origin, including its port. For HTTPS production, use the real `https://` origin so the session cookie is Secure.

```powershell
docker compose --env-file .env.local up -d --wait
npm run db:seed
```

`db:seed` applies the baseline, seven numbered migrations, and seed in transactions. Applied filenames are stored in `schema_migrations`. Repeating the command does not recreate tables or duplicate data. It never drops an existing database. For schema changes without sample data, run `npm run db:migrate`. The seed assumes a fresh baseline; do not apply it to an unrelated populated database.

An existing legacy database without migration metadata must be backed up and reviewed before adoption. Use a fresh named database for this project; do not run the baseline over live legacy tables. Existing migration files must remain immutable after application; add a new numbered migration for further changes.

## Create private accounts

In PowerShell, supply your own unique username and password. No preconfigured login exists. `Read-Host` avoids putting the password in shell command history.

```powershell
$env:BOOTSTRAP_USERNAME = Read-Host 'Admin username'
$secret = Read-Host 'Admin password (at least 12 characters)' -AsSecureString
$env:BOOTSTRAP_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
$env:BOOTSTRAP_ROLE = 'admin'
npm run user:create
Remove-Item Env:BOOTSTRAP_PASSWORD
```

Repeat with `BOOTSTRAP_ROLE='viewer'` and a different username/password. Existing usernames are rejected rather than silently reset. Passwords are salted and hashed with scrypt. The bootstrap account script needs DB access and is not exposed as a web registration endpoint.

On bash, use `read -rsp 'Password: ' BOOTSTRAP_PASSWORD; export BOOTSTRAP_PASSWORD` and set/export `BOOTSTRAP_USERNAME` and `BOOTSTRAP_ROLE` before `npm run user:create`; unset the password afterward.

## Run

```powershell
npm run dev -- --hostname 127.0.0.1
```

Open `http://localhost:3000/login`. Production mode:

```powershell
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1
```

For native database installations, set `DATABASE_URL` and `REDIS_URL` to your local services and skip Compose. Migration commands load `.env.local`; exported environment values take precedence. Stop containers with `docker compose --env-file .env.local stop`; keep volumes to retain data.

## Verify

Run database/cache checks against a fresh, seeded **test database**. API/browser tests additionally need a running server using that same database. All test accounts have randomly generated passwords. DB tests roll back mutations; API/browser suites clean up their own timestamp-prefixed fixtures. Do not run integration suites concurrently against the same database.

```powershell
npm run test:db
npm run test:cache
npm run build
npm run start
# In a second terminal, with the same environment:
npm run test:api
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

`BASE_URL` overrides the HTTP test address; `APP_ORIGIN` must match. `TEST_DATABASE_URL` can override the DB-only suite. Fixtures expect the supplied seed. Screenshots are generated in `docs/screenshots`; traces and the HTML test report are ignored by Git. GitHub Actions provisions isolated PostgreSQL/Redis services and runs these checks on Linux.

## Troubleshooting

- Connection refused: verify DB service/port and `.env.local`, then rerun migrations. Native test ports used during development were 55432 for PostgreSQL and 56379 for Redis; these are not required defaults.
- Redis unavailable: the UI continues from PostgreSQL; `test:cache` deliberately requires a real Redis service for its normal-path tests.
- Blank tables: `db:migrate` does not seed; use `db:seed` once on a fresh baseline.
- Cannot remove a team: clear its scheduled matches/participation first. Integrity rules preserve historical records rather than silently orphaning them.
- Login 429: more than 10 attempts for a username in 15 minutes; wait for the window to expire.
- Login cookie not retained over HTTP: set `APP_ORIGIN=http://localhost:3000` for the local demonstration. Use HTTPS in production.
- A Windows port is already occupied: set Compose port variables and update the URLs consistently.

The repository README was intentionally left to the project owner, as requested. These setup instructions provide reproducibility in the meantime.
